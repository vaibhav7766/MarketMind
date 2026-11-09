import yfinance as yf
import sys

def test_ticker(t):
    print(f"Testing {t}")
    try:
        info = yf.Ticker(t).info
        print(f"Success! keys: {list(info.keys())[:5]}")
    except Exception as e:
        print(f"Failed: {type(e).__name__} - {str(e)}")

test_ticker("SBIN")
test_ticker("SBIN.NS")
