// BridgeEA.mq5
// Simple file-bridge EA for MT5:
// - Exports M5 rates to CSV files in Terminal Common\Files
// - Reads commands from bridge_commands.csv and places market orders
// - Appends results to bridge_results.csv

#property strict

#include <Trade/Trade.mqh>

input string InpSymbols = "EURUSD,GBPUSD,USDJPY";
input int    InpM5Bars  = 9000;   // ~31 days of M5 bars
input int    InpTimerSec = 10;    // loop interval
input int    InpMagic   = 880042;
input int    InpDeviation = 20;

string FILE_COMMANDS = "bridge_commands.csv";
string FILE_RESULTS  = "bridge_results.csv";
string FILE_SYMBOLS  = "bridge_symbols.txt"; // optional override (Common\\Files)

CTrade trade;
string g_symbols = "";

string Trim(string s)
{
   StringTrimLeft(s);
   StringTrimRight(s);
   return s;
}

void SplitCSV(const string src, string &out[])
{
   int n = StringSplit(src, ',', out);
   if(n < 0) ArrayResize(out, 0);
}

string LoadSymbolsFromFileOrDefault()
{
   // If Common\\Files\\bridge_symbols.txt exists, it overrides InpSymbols.
   // Expected formats:
   // - comma-separated: EURUSD,GBPUSD,USDJPY
   // - one per line
   int h = FileOpen(FILE_SYMBOLS, FILE_READ|FILE_TXT|FILE_COMMON);
   if(h == INVALID_HANDLE)
      return InpSymbols;

   string out = "";
   while(!FileIsEnding(h))
   {
      string line = Trim(FileReadString(h));
      if(StringLen(line) == 0) continue;
      if(out == "") out = line;
      else out = out + "," + line;
   }
   FileClose(h);
   if(out == "") return InpSymbols;
   return out;
}

bool FileExistsCommon(const string filename)
{
   int h = FileOpen(filename, FILE_READ|FILE_TXT|FILE_COMMON);
   if(h == INVALID_HANDLE) return false;
   FileClose(h);
   return true;
}

bool HasProcessed(const string cmd_id)
{
   // Lightweight: scan results file for cmd_id (OK for small logs).
   int h = FileOpen(FILE_RESULTS, FILE_READ|FILE_TXT|FILE_COMMON);
   if(h == INVALID_HANDLE) return false;
   while(!FileIsEnding(h))
   {
      string line = FileReadString(h);
      if(StringLen(line) == 0) continue;
      if(StringFind(line, cmd_id) == 0) { FileClose(h); return true; }
   }
   FileClose(h);
   return false;
}

void AppendResult(const string cmd_id, const string symbol, const string action, const double lot, const bool ok, const int retcode, const long ticket, const string msg)
{
   int h = FileOpen(FILE_RESULTS, FILE_WRITE|FILE_READ|FILE_TXT|FILE_COMMON);
   if(h == INVALID_HANDLE) return;
   FileSeek(h, 0, SEEK_END);
   string ts = TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS);
   string line = cmd_id + "," + ts + "," + symbol + "," + action + "," + DoubleToString(lot,2) + "," + (ok ? "1" : "0") + "," + IntegerToString(retcode) + "," + IntegerToString((int)ticket) + "," + msg;
   FileWriteString(h, line + "\n");
   FileClose(h);
}

void ExportM5Rates(const string symbol)
{
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   int copied = CopyRates(symbol, PERIOD_M5, 0, InpM5Bars, rates);
   if(copied <= 0) return;

   string fname = "bridge_m5_" + symbol + ".csv";
   int h = FileOpen(fname, FILE_WRITE|FILE_TXT|FILE_COMMON);
   if(h == INVALID_HANDLE) return;

   FileWriteString(h, "time,open,high,low,close,tick_volume\n");
   // rates are series (newest first). Write oldest->newest.
   for(int i=copied-1; i>=0; i--)
   {
      string line =
         IntegerToString((int)rates[i].time) + "," +
         DoubleToString(rates[i].open, _Digits) + "," +
         DoubleToString(rates[i].high, _Digits) + "," +
         DoubleToString(rates[i].low, _Digits) + "," +
         DoubleToString(rates[i].close, _Digits) + "," +
         IntegerToString((int)rates[i].tick_volume);
      FileWriteString(h, line + "\n");
   }
   FileClose(h);
}

void ProcessCommands()
{
   if(!FileExistsCommon(FILE_COMMANDS)) return;

   int h = FileOpen(FILE_COMMANDS, FILE_READ|FILE_TXT|FILE_COMMON);
   if(h == INVALID_HANDLE) return;

   while(!FileIsEnding(h))
   {
      string line = FileReadString(h);
      line = Trim(line);
      if(StringLen(line) == 0) continue;

      // Expected CSV:
      // cmd_id,ts_utc,action,symbol,lot,sl,tp,comment
      string cols[];
      SplitCSV(line, cols);
      if(ArraySize(cols) < 7) continue;

      string cmd_id = Trim(cols[0]);
      if(cmd_id == "cmd_id" || cmd_id == "") continue;
      if(HasProcessed(cmd_id)) continue;

      string action = StringUpper(Trim(cols[2]));
      string symbol = Trim(cols[3]);
      double lot = StrToDouble(Trim(cols[4]));
      double sl = StrToDouble(Trim(cols[5]));
      double tp = StrToDouble(Trim(cols[6]));
      string comment = (ArraySize(cols) >= 8) ? Trim(cols[7]) : "bridge";

      trade.SetExpertMagicNumber(InpMagic);
      trade.SetDeviationInPoints(InpDeviation);

      // Ensure symbol is selected
      SymbolSelect(symbol, true);

      bool ok=false;
      int ret=0;
      long ticket=0;
      string msg="";

      if(action == "BUY")
      {
         ok = trade.Buy(lot, symbol, 0.0, sl, tp, comment);
      }
      else if(action == "SELL")
      {
         ok = trade.Sell(lot, symbol, 0.0, sl, tp, comment);
      }
      else
      {
         ok=false;
         msg="unsupported_action";
      }

      ret = (int)trade.ResultRetcode();
      ticket = (long)trade.ResultOrder();
      if(msg == "")
         msg = trade.ResultComment();

      AppendResult(cmd_id, symbol, action, lot, ok, ret, ticket, msg);
   }

   FileClose(h);
}

int OnInit()
{
   g_symbols = LoadSymbolsFromFileOrDefault();
   EventSetTimer(InpTimerSec);
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

void OnTimer()
{
   // Refresh symbol list (allows changing bridge_symbols.txt without restarting)
   g_symbols = LoadSymbolsFromFileOrDefault();

   // Export rates for all symbols
   string syms[];
   int n = StringSplit(g_symbols, ',', syms);
   for(int i=0; i<n; i++)
   {
      string s = Trim(syms[i]);
      if(s != "") ExportM5Rates(s);
   }

   // Process pending commands
   ProcessCommands();
}
