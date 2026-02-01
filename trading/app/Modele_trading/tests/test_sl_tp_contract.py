import math

from sl_tp_contract import compute_sl_tp


def almost_equal(a, b, tol=1e-9):
    return abs(a - b) <= tol


def test_long_basic():
    sl, tp, rr, rr_clip = compute_sl_tp(1, entry_price=1.2000, asia_high=1.2050, asia_low=1.1950, sweep_extreme=1.1980)
    assert sl == 1.1980
    assert tp == 1.2050
    assert almost_equal(rr, (1.2050 - 1.2000) / (1.2000 - 1.1980))
    assert almost_equal(rr_clip, min(max(rr, 0), 1))


def test_long_clip():
    _, _, rr, rr_clip = compute_sl_tp(1, 1.2000, 1.3000, 1.1000, 1.1999)
    assert rr > 1
    assert rr_clip == 1.0


def test_short_basic():
    sl, tp, rr, rr_clip = compute_sl_tp(-1, entry_price=1.2050, asia_high=1.2100, asia_low=1.2000, sweep_extreme=1.2070)
    assert sl == 1.2070
    assert tp == 1.2000
    assert almost_equal(rr, (1.2050 - 1.2000) / (1.2070 - 1.2050))
    assert almost_equal(rr_clip, min(max(rr, 0), 1))


def test_short_clip():
    _, _, rr, rr_clip = compute_sl_tp(-1, 1.2500, 1.2600, 1.0000, 1.2490)
    assert rr > 1
    assert rr_clip == 1.0


def test_zero_risk_guard():
    # entry_price == sl -> risk guarded to epsilon
    _, _, rr, rr_clip = compute_sl_tp(1, 1.2000, 1.2100, 1.1900, 1.2000)
    assert math.isfinite(rr)
    assert rr_clip == 1.0
