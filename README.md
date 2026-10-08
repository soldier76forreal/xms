# XMS

XMS is the internal React application for inventory, CRM, digital marketing, branches, and requests. Its website-facing data is served by the sibling `api/` project. The public Next.js site is in `../website/`.

## Run locally

Install dependencies with `npm install`, then run `npm start` from this directory. The app uses Create React App. Set `PORT` if port 3000 is occupied by the public website. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

The browser needs the XMS API and auth services. Configure their local ports with `REACT_APP_API_PORT` and `REACT_APP_AUTH_PORT` in `.env.local`; the API's own `PORT` must match the API port. Start the API with its database and run the auth service separately. The public website also needs its XMS API base/port configured to reach the same API. Do not commit credentials or local environment files.

Useful commands: `npm run build` for a production bundle, and `npm test` for the CRA test runner.

## Website-connected workflows

- **Digital Marketing > Product Content:** Manage records by product code, including English/Arabic/Persian content, images, categories, tags, and SEO fields. Content is shared across branches; live varieties, dimensions, and stock come from each branch's inventory. Raw Content and Ready to Upload remain separate sections.
- **People > Branches:** Set each branch's website slug, country, contact phone, optional flag image, and one or more associates. The public site uses the slug for paths such as `/ksa/` and `/ksa/ar/`, displays the configured flag/phone, and queries that branch's inventory. A flag upload is stored by the API and falls back to the site's country flag when absent.
- **CRM > Customers:** Website purchase-request submissions are associated with their selected branch. A visitor's verified email identifies the customer record used for their request-only portal.
- **MIS > Requests > Customer-branch requests:** Staff see requests for their active branch, can search/filter them, review product varieties and requested amounts, and send a response that is emailed to the customer. This is separate from inter-branch requests. Associate notifications use each branch's configured associates.

The public site's `/my-account/` page is only for a customer to view their own requests and responses. It does not expose the XMS workspace, inventory administration, or a general customer account.

## Data boundaries

Product content is keyed by product code, but availability is calculated from the selected branch's live inventory. Do not treat local seed data as production data: a local database may have a stocked `Main Branch` without a country, while the online environment has no Main Branch. The default website branch remains UAE; its public availability must reflect the actual UAE branch data.

Implementation entry points: `src/components/digitalMarketing/digitalMarketing.js`, `src/components/mis/mis.js`, `src/components/authAndConnections/axiosGlobalUrl.js`, and the sibling API routes under `../api/routes/public/website.js`, `../api/routes/digitalMarketing/productContent.js`, and `../api/routes/priceRequests/main.js`.
