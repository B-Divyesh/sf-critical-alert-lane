# Demo sandbox

Open [the demo route](/?demo=1) or use **Try it with sample data** from the
first screen. One click opens three shipped sample reminders:

- **Take evening medicine** is already due and repeats every five minutes until
  it is snoozed or acknowledged.
- **Call the insurance case worker** is a realistic one-time follow-up.
- **Water the balcony plants** is a weekly reminder.

The persistent **Demo — sample data, nothing is saved** banner offers **Reset
demo**, which restores those samples, and **Start for real**, which discards
the demo state and returns to an empty real lane. Demo records use IndexedDB
database `demo:critical-alert-lane`; real records use
`critical-alert-lane`. Demo mode does not read or write the real reminder
database, local license token, or native Android scheduler. Leaving through
the brand, legal links, Sociobot link, or checkout also discards demo changes.

Browser claim tests enter through `/?demo=1` or its `/demo/` alias from a
fresh context.
