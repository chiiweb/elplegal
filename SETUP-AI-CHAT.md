# setting up the ai chat bot (openrouter + vercel) uwu

your site now has a floating chat bubble bottom-right ("ask el plegal"). here's how to wire it up~

## 1. project structure
```
your-project/
  index.html        <- the site
  api/
    chat.js         <- the serverless function (already done for you!)
```
vercel auto-detects anything in `/api` as a serverless function, so just keep this folder structure and deploy as-is.

## 2. get an openrouter key
1. go to https://openrouter.ai and sign up
2. create an api key (looks like `sk-or-v1-...`)
3. add a little credit to your account (openrouter is pay-as-you-go)

## 3. add the key to vercel
in your vercel project:
- settings → environment variables
- add `OPENROUTER_API_KEY` = your key
- (optional) add `OPENROUTER_MODEL` = whichever model slug you want, e.g. `openai/gpt-4o-mini`, `anthropic/claude-3.5-haiku`, `meta-llama/llama-3.1-8b-instruct` — cheaper models are great for a support widget!
- (optional) add `SITE_URL` = your real deployed domain, e.g. `https://elplegal.com`

redeploy after adding env vars (vercel needs a fresh deploy to pick them up).

## 4. deploy
```bash
npm i -g vercel   # if you don't have it yet
vercel            # follow the prompts, link/create your project
vercel --prod     # ship it!
```

## 5. test it
open your deployed site, click the chat bubble, ask something like "what practice areas do you cover?" — it should type back a lil answer within a couple seconds.

## notes
- the api key NEVER touches the browser — it lives only in `api/chat.js` on the server, safe n sound.
- the widget keeps a short rolling history (last 12 messages) so the bot has context without costing a fortune per message.
- the system prompt in `index.html` tells the bot to stick to general info and always point people to book a real consultation for anything matter-specific — keeps things safe and on-brand.
- if you deploy the site somewhere OTHER than the same vercel project as the api function, update `CHAT_ENDPOINT` near the bottom of `index.html`'s script to the full url of your deployed `/api/chat`.
