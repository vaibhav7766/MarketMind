import httpx
import asyncio

async def test():
    url = "https://news.google.com/rss/articles/CBMi1AFBVV95cUxOeTZPaWVTdF9HOWtpMUIyalFGaThyNnVrQ0FXM1BTZUZiS2podkQ3TGpqTEdrcEJIeVlyUmgwZHQ1UGpOcnktbXhZV3Rfc1BnZzhaN1VDbEdQcDFzT1BGak9EWkdTM0RpWmxnM2phVXNwbWh0TmdIa2JLa3YyRWswVFpxTjR0cGRjX09ZRl9SNHVrdFlKaElIMWQyTVpLTzVaeHNCY1Z0NWxJeW11UUIweThYVE9GSW4tQW1fbjdnUGktRVNCemw4Tm1xVXQwY182dEQxX9IB2gFBVV95cUxOXzVBQkZnUjZ3WXJUN1d4ZjdLa3BSc3NhTDl1T1RNWjNiSmtSN1dkVHpMVlE0aHVYSVp5VU1BcF9KTTE2S284M25QTWNMUEw4UFdsT09FSy1jU19kTlBfZlJUd0ZiSFh1V2JRUkJ3Mno0R2lMU1ZwUHl1SmZERl9mM29IZjZhbXNHeE1sa1ZsMmpXZVlxOVUtUDJRM1owdHA1V29NTFBoaVVJd2t3MHZIbHNaWm93Z0F5RzlUYTBLcGRNY3NYZjNHSmtneVc4eFZXVkh3UmNSQTE3QQ?oc=5&hl=en-IN&gl=IN&ceid=IN:en"
    async with httpx.AsyncClient(follow_redirects=True) as client:
        r = await client.get(url)
        print("Status code:", r.status_code)
        print("Final URL:", r.url)
        print("HTML Snippet:", r.text[:200])

asyncio.run(test())
