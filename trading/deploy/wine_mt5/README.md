# MT5 sur serveur Ubuntu (Wine) — guide opérationnel

Contexte : sur ce serveur Ubuntu, **KVM/VM Windows n’est pas disponible** (pas de `/dev/kvm`).
Pour exécuter un modèle Python qui trade via MT5, il faut un **terminal MT5 Windows**.
La solution viable sur ce serveur est donc :

- **Wine** pour exécuter MT5 (Windows)
- **Python Windows** (sous Wine) pour exécuter ton code
- **Xvfb** (écran virtuel) pour faire tourner MT5 “headless”
- (optionnel) **x11vnc** pour te connecter à l’écran virtuel une fois et te logguer

## IMPORTANT — Mode Bridge (recommandé)
Le module Python `MetaTrader5` est **instable sous Wine** (IPC timeout).
On utilise donc un **EA MQL5** (BridgeEA) qui :
- exporte les bougies M5 vers `Common\\Files/bridge_m5_<SYMBOL>.csv`
- lit `Common\\Files/bridge_commands.csv` et exécute les ordres
- écrit `Common\\Files/bridge_results.csv` avec le résultat

## 1) Installation (à faire sur le serveur)

> Tous les scripts ci-dessous nécessitent `sudo` (installation paquets).

```bash
cd /opt/innovaplus/KORYXA
git checkout feature/module2-themes
git pull

bash trading/deploy/wine_mt5/setup_wine_mt5.sh
```

## 2) Connexion au compte (Fusion Markets) — 1ère fois

Deux options :

### A) Headless + VNC (recommandé)
Le setup prépare un écran Xvfb `:99`.
Tu peux lancer MT5 puis ouvrir l’accès VNC (à la demande) :

```bash
bash trading/deploy/wine_mt5/start_vnc.sh
```

Puis depuis ton PC :
- fais un tunnel SSH : `ssh -L 5900:localhost:5900 innova@46.224.25.143`
- ouvre un client VNC sur `localhost:5900`
- connecte-toi dans MT5 (login/serveur/mot de passe).

### B) Écran local (si tu as déjà un desktop)
Si le serveur a déjà une session graphique, tu peux lancer MT5 directement sans VNC.

## 3) Lancer le modèle

### 3.0 Installer l’EA Bridge dans MT5 (obligatoire)
Sur le serveur :
```bash
bash trading/deploy/wine_mt5/install_bridge_ea.sh
```

Puis dans MT5 (via VNC) :
- Ouvre **MetaEditor**
- Compile `BridgeEA.mq5`
- Attache `BridgeEA` à un graphique (n’importe lequel)
- Active **Algo Trading**
- Pour la liste des paires, 2 options :
  - soit tu modifies `InpSymbols`
  - soit (recommandé) tu crées un fichier `bridge_symbols.txt` dans `Common\\Files` (tu peux le faire depuis Linux)

Exemple (serveur) :
```bash
cat > "/opt/innovaplus/trading/wine/prefix/drive_c/users/innova/AppData/Roaming/MetaQuotes/Terminal/Common/Files/bridge_symbols.txt" <<'EOF'
AUDCAD=X
AUDCHF=X
AUDJPY=X
AUDNZD=X
CADCHF=X
CADJPY=X
CHFJPY=X
EURAUD=X
EURCAD=X
EURCHF=X
EURGBP=X
EURNOK=X
EURNZD=X
EURSEK=X
EURUSD=X
GBPAUD=X
GBPCAD=X
GBPCHF=X
GBPNZD=X
GBPUSD=X
NZDCAD=X
NZDCHF=X
USDCAD=X
USDCHF=X
USDHUF=X
USDMXN=X
USDNOK=X
USDPLN=X
USDSEK=X
USDTRY=X
USDZAR=X
EOF
```

Mode boucle (prod) :
```bash
bash trading/deploy/wine_mt5/run_trading_wine.sh \
  --symbols "EURUSD,GBPUSD,USDJPY" \
  --mode SELF \
  --trade \
  --lot 0.02 \
  --interval 60
```

Mode “cron” (un run) :
```bash
bash trading/deploy/wine_mt5/run_trading_wine.sh \
  --symbols "EURUSD,GBPUSD,USDJPY" \
  --mode SELF \
  --trade \
  --lot 0.02 \
  --once
```

## Notes importantes
- Si tu vois une erreur Wine du type `ucrtbase.dll.* unimplemented` (ex: `crealf`) lors de l’exécution Python,
  installe les runtimes Visual C++ dans le prefix Wine :
  - `bash trading/deploy/wine_mt5/fix_wine_prefix.sh`
- Les secrets (login/MDP MT5) **ne sont pas stockés dans Git**. La connexion se fait dans MT5.
- Le modèle ne peut trader que si MT5 est **connecté** au compte.
- Les logs sont dans `/opt/innovaplus/trading/app/Modele_trading/` (`signals.*`, `trades_log.csv`, `state/trade_state.csv`).
