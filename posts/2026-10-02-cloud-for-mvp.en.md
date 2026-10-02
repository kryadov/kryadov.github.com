---
summary: Between clouds, an MVP's bill differs by less than $100 a month; the cost of leaving differs by a quarter of work. AWS, Google Cloud, Azure, Oracle, Hetzner, PaaS, Chinese, Russian, European and GPU clouds on one and the same service: what it costs, where it hurts and how you get out later.
---

# The cheapest cloud is the one you can leave: AWS, Hetzner or Render for your MVP

This piece is for whoever launches a new service and answers for where it will live: the DevOps person, the tech lead or the only backend developer on the team. I took one typical MVP and laid it out across some twenty platforms, from AWS and Google Cloud to Hetzner, Render, Yandex Cloud, Alibaba Cloud and GPU clouds. For each one I worked out the monthly bill, where it hurts and how you get out later.

The conclusion is unexpected: at the start the bills differ by less than $100 a month, while the cost of moving eighteen months later differs by a quarter of work. So choose a cloud for your MVP by the exit, not by the bill.

## TL;DR

- **At the start, the bills differ by tens of dollars a month.** The choice becomes expensive later, when the cloud is hard to leave: egress, rewritten IAM, provider-specific services you have grown into.
- **No DevOps person on the team? Take a managed PaaS, but not Heroku.** Since February 2026 Heroku has been in "sustaining engineering" mode: no new features. Render is the modern replacement, but watch the bandwidth: beyond the included amount it costs $0.15 per GB.
- **Some time and a wish to save? Hetzner + Coolify.** About €9 a month for a server with 20 TB of traffic in Europe. The price: the database, backups and upgrades are now yours.
- **Among the hyperscalers, Google Cloud Run and Azure Container Apps suit an MVP best.** Scale-to-zero and a monthly free allowance mean you mostly pay for the database and egress. AWS costs more at the start because of the load balancer, public IPv4 and the NAT Gateway, and App Runner has been closed to new customers since 30 April 2026.
- **Oracle's free tier isn't what it was:** Ampere A1 has been cut to 2 OCPUs and 12 GB, and Oracle reclaims idle machines.
- **Sometimes jurisdiction chooses for you:**
  - **Users in mainland China** mean a mainland region of a Chinese cloud, ICP filing and a local entity or partner. By default that's Alibaba Cloud, the largest, with Qwen models. Tencent Cloud if the product lives in WeChat (mini programs, games). Huawei Cloud if the customers are government and state-owned companies.
  - **Russian personal data** (Federal Law 152-FZ) means Yandex Cloud (the most mature), Cloud.ru (with GigaChat next door) or VK Cloud.
  - **European public sector, finance and healthcare** mean sovereign clouds: OVHcloud, Scaleway, STACKIT or AWS European Sovereign Cloud.
- **LLMs at the start: use an API.** GPU clouds matter once you run your own model: an H100 costs from $3.99 (Lambda) to ~$6.88 (AWS) per GPU-hour.
- **Keep the door open:** containers, Postgres, the S3 API and Terraform. Then a move takes weeks, not a quarter.

*Prices are as of October 2026, excluding VAT (except the Russian clouds, whose prices include VAT), for US East or German regions. Prices move fast: in the past year Hetzner and Nebius raised theirs and AWS closed App Runner. Check the links before you decide.*

## Contents

- [1. What we are deploying](#1-what-we-are-deploying)
- [2. What a DevOps person weighs at the start](#2-what-a-devops-person-weighs-at-the-start)
- [3. The hyperscalers](#3-the-hyperscalers)
  - [3.1. AWS: the widest choice and the most expensive start](#31-aws-the-widest-choice-and-the-most-expensive-start)
  - [3.2. Google Cloud: Cloud Run and scale-to-zero](#32-google-cloud-cloud-run-and-scale-to-zero)
  - [3.3. Azure: Container Apps, credits and Azure OpenAI](#33-azure-container-apps-credits-and-azure-openai)
  - [3.4. Oracle Cloud: the best free tier, and its catches](#34-oracle-cloud-the-best-free-tier-and-its-catches)
- [4. Simple clouds: Hetzner and DigitalOcean](#4-simple-clouds-hetzner-and-digitalocean)
- [5. The PaaS layer](#5-the-paas-layer)
  - [5.1. Heroku and Render: paying not to think](#51-heroku-and-render-paying-not-to-think)
  - [5.2. Coolify (and Dokku, Kamal): a PaaS on your own VPS](#52-coolify-and-dokku-kamal-a-paas-on-your-own-vps)
- [6. Regional clouds: when jurisdiction chooses for you](#6-regional-clouds-when-jurisdiction-chooses-for-you)
  - [6.1. China: Alibaba Cloud, Tencent Cloud, Huawei Cloud](#61-china-alibaba-cloud-tencent-cloud-huawei-cloud)
  - [6.2. Russia: Yandex Cloud, Cloud.ru, VK Cloud](#62-russia-yandex-cloud-cloudru-vk-cloud)
  - [6.3. Europe: sovereign clouds](#63-europe-sovereign-clouds)
  - [6.4. The rest of the world](#64-the-rest-of-the-world)
- [7. GPU clouds: when you need your own model](#7-gpu-clouds-when-you-need-your-own-model)
- [8. Summary table: the monthly bill for one and the same MVP](#8-summary-table-the-monthly-bill-for-one-and-the-same-mvp)
- [9. What happens when you grow](#9-what-happens-when-you-grow)
- [10. How not to get stuck](#10-how-not-to-get-stuck)
- [11. Decision tree](#11-decision-tree)

## 1. What we are deploying

To keep the comparison fair, take one typical MVP and deploy it, in our heads, on every provider:

- an **API** and a **background worker** in two containers;
- **Postgres**, managed if the provider offers it;
- **S3-compatible storage** for user files;
- **a domain and TLS**;
- **deploys from CI** on every push to main;
- **LLM features through an API** (OpenAI, Anthropic, YandexGPT, Qwen; it doesn't matter which), no model of our own.

The load is small: up to 10 requests per second at peak, close to zero at night, about 200 GB of egress a month. The team is two or three developers, with no dedicated DevOps person or one who does everything.

## 2. What a DevOps person weighs at the start

Marketing tables compare the number of services. For an MVP, other things matter:

- **Time to first deploy.** How many steps from an empty account to a working HTTPS address. Minutes on a PaaS; a day on AWS from scratch if you do it properly.
- **The idle bill.** Nobody uses an MVP most of the time. If the platform scales to zero, nights and weekends are free. If not, you pay for 730 hours a month.
- **The minimum price of managed Postgres.** One of the biggest lines on an MVP's bill, often bigger than compute.
- **Egress.** The main surprise on the bill. $0.087–0.12 per GB at the hyperscalers; terabytes included in the server price at Hetzner and DigitalOcean.
- **Terraform and IaC.** Can you describe everything as code and bring up a second environment with one command?
- **What you'll have to rewrite to leave.** IAM policies, triggers, proprietary queues and databases, provider-specific SDKs.

The last point is the one that matters. The others decide the bill for the first six months; this one decides what the choice costs eighteen months from now.

## 3. The hyperscalers

### 3.1. AWS: the widest choice and the most expensive start

A year ago I would have suggested App Runner for a service like this. But [since 30 April 2026 App Runner has been closed to new customers](https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html): existing users carry on, no new features are coming. In its place AWS recommends [ECS Express Mode](https://aws.amazon.com/about-aws/whats-new/2025/11/announcing-amazon-ecs-express-mode/), a mode of ECS on Fargate that creates the service, the load balancer and autoscaling for you. The mode itself is free; you pay for the resources underneath.

What the bill is made of:

- **Fargate** on Graviton: [$0.0324 per vCPU-hour and $0.00356 per GB-hour](https://aws.amazon.com/fargate/pricing/). An API with 0.5 vCPU and 1 GB running around the clock is about $14 a month; a worker half that size, about $7. No scale-to-zero.
- **Application Load Balancer:** about $16 a month plus LCUs. ECS Express Mode can put up to 25 services behind one ALB, which helps once you have many services.
- **Public IPv4:** [$0.005 an hour per address](https://aws.amazon.com/vpc/pricing/), so $3.65 a month, idle addresses included.
- **NAT Gateway**, if your tasks live in a private subnet as best practice says: $0.045 an hour (~$33 a month) plus $0.045 for every gigabyte through it. A classic trap: the NAT can easily cost more than the rest of the MVP.
- **RDS for PostgreSQL** db.t4g.micro: $0.016 an hour, about $12 a month plus storage.
- **Egress:** the first 100 GB a month free (summed across services), then $0.09 per GB.

That comes to about $70 a month, or about $100 with a NAT Gateway. The [Free Tier](https://aws.amazon.com/free/) has worked differently since 2025: $100 in credits up front and up to $100 more for trying out services, up to $200 over six months. On the free plan the account closes itself when the credits run out or the six months are up.

**Where it hurts.** IAM is the most powerful permission model of all, and the hardest. You'll need to understand the network (VPC, subnets, NAT, security groups) from day one. On the other hand, the AWS Terraform provider is the gold standard, and growing from an MVP into anything at all requires no move.

### 3.2. Google Cloud: Cloud Run and scale-to-zero

For an MVP, Cloud Run is the best thing the hyperscalers have. Hand it a container, get an HTTPS address. With no requests there are zero instances and zero bill.

- **The free allowance** for request-based billing: [180,000 vCPU-seconds, 360,000 GiB-seconds and 2 million requests a month](https://cloud.google.com/run/pricing). Beyond it, $0.000024 per vCPU-second and $0.0000025 per GiB-second. Our MVP's API will most likely fit inside the free allowance. The worker can run as a Cloud Run Job, with its own separate free allowance.
- **Cloud SQL:** the smallest instance, db-f1-micro, costs [$0.0105 an hour](https://cloud.google.com/sql/pricing), about $8 a month plus storage. A caveat: shared-CPU instances (db-f1-micro and db-g1-small) are not covered by the SLA.
- **Egress** from Cloud Run goes over the Premium Tier: [about $0.12 per GiB](https://cloud.google.com/vpc/network-pricing) for the first terabyte. The free 200 GiB a month exists only on the Standard Tier.
- **The trial:** [$300 in credits for 90 days](https://cloud.google.com/free/docs/free-cloud-features).

That comes to about $10 for the database plus egress: at 200 GB, roughly another $24, ~$35 in all.

**Where it hurts.** Cold starts after idling: the first request waits for a container to come up unless you pay to keep a minimum instance warm. IAM is simpler than AWS's, but the project model and service accounts need attention too.

### 3.3. Azure: Container Apps, credits and Azure OpenAI

[Azure Container Apps](https://azure.microsoft.com/en-us/pricing/details/container-apps/) is a direct counterpart to Cloud Run: the same per-second billing, the same scale-to-zero and nearly the same free allowance, 180,000 vCPU-seconds and 360,000 GiB-seconds a month. An active vCPU costs the same $0.000024 a second.

- **PostgreSQL Flexible Server** B1ms (1 vCore, 2 GB): $0.017 an hour, about $12 a month, plus storage at $0.115 per GB (32 GB minimum, ~$4 more). Prices are from the [Azure retail prices API](https://prices.azure.com/api/retail/prices).
- **Egress:** [the first 100 GB free](https://azure.microsoft.com/en-us/pricing/details/bandwidth/), then about $0.087 per GB.

That comes to about $25 a month, the lowest of the hyperscalers if the API fits in the free allowance.

**Where Azure wins.** If your LLM features use OpenAI models, Azure OpenAI gives you them under an enterprise contract, in the region you need, with no extra vendor. For B2B customers on the Microsoft stack, that is an argument in itself. **Where it hurts.** Entra ID, subscriptions, resource groups and roles are a discipline of their own, and the portal is slower than the competition's.

### 3.4. Oracle Cloud: the best free tier, and its catches

Oracle's [Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) is still the most generous, but not in the way older guides describe:

- **Ampere A1** is now 1,500 OCPU-hours and 9,000 GB-hours a month, which is **2 OCPUs and 12 GB of memory**, not 4 and 24 as before;
- plus two AMD micro machines (1/8 OCPU, 1 GB), 200 GB of block storage in total and a 20 GB Autonomous Database (that's Oracle, not Postgres);
- **10 TB of free egress a month**, orders of magnitude more than the other hyperscalers.

You'll have to run Postgres yourself on the same machine, and the whole MVP costs $0.

**The catches.**

- **Oracle reclaims idle machines.** If over 7 days the 95th percentile of CPU use is under 20%, and network and (for A1) memory are under 20% too, a free instance can be taken back. An MVP with no traffic fits that rule perfectly.
- **Capacity is short.** Complaints about no free A1 capacity in popular regions are common.
- **Account terminations.** Stories of free accounts terminated without explanation are a familiar genre.

Oracle is great for a pet project. For an MVP that a business depends on, only with an upgrade to a paid account.

## 4. Simple clouds: Hetzner and DigitalOcean

Bare virtual machines cost a fraction of the price, but everything beyond them is on you.

**Hetzner.** Even after the [price increase of 15 June 2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), it is the cheapest serious option:

- **Prices after the increase:** a CX23 (2 vCPUs, 4 GB) went from €3.99 to €5.49 a month; the ARM CAX11, from €4.49 to €5.99. The CPX and CCX families went up 2–3×, so for a cheap MVP look only at CX and CAX now.
- **Traffic:** each server includes 20 TB in the European locations and 1 TB in the American ones.
- **Six locations:** Falkenstein, Nuremberg, Helsinki, Ashburn, Hillsboro and Singapore.

Two CX23s (one for the app, one for Postgres) come to about €12 a month plus public IPv4.

**Where Hetzner hurts:**

- no managed Postgres: backups, upgrades and replicas are on you;
- no managed Kubernetes;
- support means tickets, not an engineer on the phone.

**DigitalOcean** sits between Hetzner and the hyperscalers:

- **Droplets:** [from $6 a month](https://www.digitalocean.com/pricing/droplets) for 1 GB with 1 TB of transfer.
- **Managed Postgres:** [from $15 a month](https://www.digitalocean.com/pricing/managed-databases).
- **PaaS:** App Platform from $5.
- **Kubernetes:** DOKS with a free control plane.

A 2 GB server, the database and Spaces storage come to about $32 a month, and traffic within the included allowance is free.

## 5. The PaaS layer

A PaaS isn't another cloud but a layer on top of one. You pay so you don't have to think about infrastructure. That is a decision about the cost of leaving too: the more the platform does for you, the more you'll have to do yourself when you move.

### 5.1. Heroku and Render: paying not to think

**Heroku** invented the genre: `git push heroku main` and it works. But on 6 February 2026 Salesforce announced that [Heroku is moving to a "sustaining engineering" model](https://www.devclass.com/containers/2026/02/09/heroku-future-in-doubt-as-salesforce-freezes-features-to-focus-on-ai/4090238): security and stability only, no new features, no new enterprise contracts. Credit-card customers are unaffected for now.

[Prices](https://www.heroku.com/pricing):

- Eco: $5 a month, sleeps after 30 minutes idle;
- Basic: $7;
- Standard-1X: $25;
- Postgres Essential-0: $5 for 1 GB; Essential-1: $9 for 10 GB.

Our MVP (two Basic dynos and Essential-0) is about $19 a month. Cheap, but I wouldn't start a new project on a platform its owner has frozen.

**Render** is the modern Heroku: web services, workers, cron, Postgres, PR previews, and proper Docker images instead of buildpacks.

[Prices](https://render.com/pricing):

- the Hobby plan is $0 plus compute; Pro is $25 a month;
- a 512 MB service costs $7;
- Postgres costs $6 for 256 MB or $19 for 1 GB.

**Render's trap is bandwidth.** Hobby includes 5 GB and Pro 25 GB, then it's $0.15 per GB. Our 200 GB adds ~$29, and a $20 MVP turns into a ~$50 one. There are five regions (Oregon, Ohio, Virginia, Frankfurt, Singapore), and [you can't change the region of an existing service](https://render.com/docs/regions), only recreate it.

### 5.2. Coolify (and Dokku, Kamal): a PaaS on your own VPS

[Coolify](https://coolify.io/pricing/) is an open-source PaaS you install on your own server. It gives you the same "push → deploy" experience: builds, TLS via Let's Encrypt, one-click databases and backups to S3. The self-hosted edition is free with no feature limits; the cloud edition, where Coolify manages your servers, is $5 a month for two servers.

A Hetzner CX33 (4 vCPUs, 8 GB) with Coolify and Postgres on it is about €9 a month plus IPv4. That is nearly the price of the hardware for nearly the Render experience. The price: upgrades, backups and outages of Coolify itself are now your responsibility.

Simpler alternatives: [Dokku](https://dokku.com), "Heroku on a single server", and [Kamal](https://kamal-deploy.org) from 37signals, container deploys over SSH with no dashboard.

## 6. Regional clouds: when jurisdiction chooses for you

### 6.1. China: Alibaba Cloud, Tencent Cloud, Huawei Cloud

These are two entirely different stories.

**The international regions** are an ordinary cloud, cheaper than the hyperscalers in places. Alibaba Cloud has [31 regions](https://www.alibabacloud.com/en/global-locations). Simple Application Server starts at $3.5 a month and Tencent Cloud Lighthouse [at $4.2](https://www.tencentcloud.com/products/lighthouse). The managed services look like AWS's: Kubernetes (ACK), databases (ApsaraDB, PolarDB), object storage. Outside China they make sense only if they win on price in the part of Asia you need, or you want to be close to Chinese models.

**Mainland China** is another world:

- a site hosted on the mainland must complete [ICP filing](https://www.alibabacloud.com/help/en/icp-filing/basic-icp-service/product-overview/icp-filing-application-for-enterprises-outside-the-chinese-mainland) (备案) with the Ministry of Industry and Information Technology;
- Hong Kong and Macau don't count;
- a foreign company cannot get an ICP licence directly; you need a local entity or a licensed partner;
- and then there's the Great Firewall between your users and anything hosted outside.

If your users are in China, this is a separate project with its own lawyer, not a region picker in a console.

**Which of the three.**

- **Alibaba Cloud** is the default: China's largest cloud, the widest range of services, help with ICP filing, and its own Qwen models close at hand.
- **Tencent Cloud** if the product lives in the WeChat ecosystem (mini programs, WeChat login, payments) or is a game: that is Tencent's home turf.
- **Huawei Cloud** if the customers are government and state-owned companies, or if independence from American hardware matters: Huawei builds its AI infrastructure on its own Ascend accelerators.

**Models.** Qwen through Alibaba Model Studio, DeepSeek, and ByteDance's Volcano Engine offer strong, cheap APIs. That is the one part of the Chinese cloud that interests nearly everyone.

### 6.2. Russia: Yandex Cloud, Cloud.ru, VK Cloud

If you process personal data of Russian citizens, Federal Law 152-FZ requires it to be recorded and stored in databases located in Russia. The Western hyperscalers drop out here, both legally and because they can't be paid for from Russia.

**Yandex Cloud** is the most mature of the Russian clouds. Prices from its [documentation](https://github.com/yandex-cloud/docs), after the spring 2026 increase, VAT included:

- **Serverless Containers**, the Cloud Run counterpart: ₽5.69 per vCPU-hour, ₽3.79 per GB-hour, ₽18.97 per million invocations. Free each month: 1 million invocations, 5 vCPU-hours and 10 GB-hours. That is much less than Google's, so an MVP with steady load will outgrow it.
- **Managed PostgreSQL:** the smallest host, b2.medium (2 vCPUs with a guaranteed 50% share, 4 GB), costs about ₽3,000 a month plus storage.
- **Egress:** the first 100 GB free, then ₽1.42 per GB.

About ₽3,500 a month in all. The catch is that it is essentially one region (ru-central1).

**Cloud.ru** (formerly SberCloud) has GigaChat next door, but its free VM [is not available to anyone who signed up after 30 June 2026](https://cloud.ru/docs/evolution/overview/topics/free-tier__virtual-machines). **VK Cloud** is the third option. If you need public-sector certification, compare them by their list of certificates, not by price.

### 6.3. Europe: sovereign clouds

Here the issue isn't a localisation law but the **US CLOUD Act**: data in a European region of AWS, Google or Microsoft is formally reachable by US authorities because the provider is an American company. For the public sector, finance and healthcare that is an argument; France has a dedicated certification, **SecNumCloud**.

- **European providers:** [OVHcloud](https://www.ovhcloud.com) and [Scaleway](https://www.scaleway.com) in France; [STACKIT](https://www.stackit.de) (Schwarz Group), IONOS and Open Telekom Cloud in Germany. Scaleway has [Serverless Containers](https://www.scaleway.com/en/pricing/serverless/) with a free allowance of 200,000 vCPU-seconds and 400,000 GB-seconds a month. Its managed Postgres DB-DEV-S is about €11 a month, but that's a dev tier without HA.
- **The hyperscalers' answer:** [AWS European Sovereign Cloud](https://www.datacenterdynamics.com/en/news/aws-european-sovereign-cloud-now-generally-available/) launched on 15 January 2026 in Brandenburg (region `eusc-de-east-1`). It is a separately partitioned AWS operated only by EU residents, with about 90 services at launch. Whether it closes the CLOUD Act question while the parent company is American is still being argued. Google and Microsoft offer sovereign options through local partners.

For an MVP this is rarely decisive. But if your target customer is a European bank, better to know before you've grown into us-east-1.

### 6.4. The rest of the world

Data residency requirements exist almost everywhere; the Chinese and Russian cases are just the strictest.

- **South Korea.** The public sector requires CSAP certification, with staff and data in Korea, which effectively closes it to foreign providers. In spring 2026 the government announced that authority over public-sector access would move to the NIS.
- **Japan.** It has clouds of its own: Sakura Internet is among the government cloud providers.
- **The Middle East.** Saudi Arabia and the UAE require localisation, and the hyperscalers build regions there with local partners. Microsoft's Saudi Arabia East region, for example, opens in Q4 2026.
- **India, Indonesia, Vietnam, Turkey.** Each has data localisation laws, usually met by the hyperscalers' local regions rather than separate clouds.

## 7. GPU clouds: when you need your own model

An MVP almost never needs its own model. An API is cheaper while volume is small, and you don't pay for a GPU that sits idle 90% of the time. Your own model becomes necessary when:

- the data can't go to an external API;
- volume has grown to the point where the API costs more than renting;
- you need a fine-tuned model.

Then the H100 prices as of October 2026 (on-demand, per GPU-hour, in 8-GPU machines) are:

| Provider | H100, $/GPU-hour | Note |
| --- | --- | --- |
| [Lambda](https://lambda.ai/pricing) | $3.99 | H100 SXM, self-serve |
| [Nebius](https://nebius.com/prices) | $4.50 | from 1 October 2026; $3.85 before |
| [CoreWeave](https://www.coreweave.com/pricing) | $6.16 | $49.24 an hour for an 8-GPU node |
| AWS p5.48xlarge | ~$6.88 | ~$55 an hour per node after the June 2025 price cut |

One H100 around the clock is $2,900–5,000 a month, the price of dozens, if not hundreds, of MVPs. Cloud Run has L4 GPUs billed per second (about $0.67 an hour), a bridge between an API and your own cluster for small models and experiments. What self-hosting a specific model really costs, racks, power and people included, is what my [inference TCO calculator](https://kryadov.github.io/llm-hardware-calculator/) works out.

## 8. Summary table: the monthly bill for one and the same MVP

An estimate for the reference service from section 1: API and worker, the smallest managed Postgres (or your own on a VM where there's no managed one), ~200 GB of egress. No credits, no free trials.

| Platform | How to deploy | ≈ per month | Main caveat |
| --- | --- | --- | --- |
| AWS | ECS Express Mode (Fargate) + RDS | ~$70, ~$100 with NAT | ALB, IPv4 and NAT cost more than compute |
| Google Cloud | Cloud Run + Cloud SQL | ~$35 | db-f1-micro has no SLA; Premium Tier egress |
| Azure | Container Apps + PostgreSQL Flexible | ~$25 | cold starts; complex permissions model |
| Oracle Cloud | Always Free A1 + your own Postgres | $0 | idle machines get reclaimed |
| Hetzner | 2 × CX23, your own Postgres | ~€12 + IPv4 | database and backups are on you |
| DigitalOcean | Droplet + Managed PG + Spaces | ~$32 | nothing major |
| Heroku | 2 × Basic + Essential-0 | ~$19 | the platform is frozen |
| Render | 2 services + Postgres, Hobby | ~$50 | $0.15/GB beyond 5 GB of bandwidth |
| Hetzner + Coolify | CX33, everything on one server | ~€9 + IPv4 | Coolify needs looking after too |
| Alibaba / Tencent (intl.) | VPS + your own Postgres | from ~$5–10 | outside China, only for the price |
| Yandex Cloud | Serverless Containers + Managed PG | ~₽3,500 (incl. VAT) | one region |
| Scaleway | Serverless Containers + DB-DEV-S | ~€11–15 | dev-tier database without HA |

The gap between the cheapest and the most expensive option is under $100 a month, about an hour or two of an engineer's time. That is why choosing by this table is a mistake. Choose by the next one.

## 9. What happens when you grow

An MVP that takes off may need, a year later, dozens of services, database replicas, several regions and GPUs. The question is whether you'll have to move to get them.

| Platform | Growth path without moving | Managed Kubernetes | Postgres as you grow | Regions | GPUs |
| --- | --- | --- | --- | --- | --- |
| AWS | ECS Express → ECS/EKS | EKS, $0.10/h per cluster | RDS Multi-AZ, replicas, Aurora | 39 | H100, B200 |
| Google Cloud | Cloud Run → GKE (same container) | GKE, $0.10/h, one cluster free | Cloud SQL HA, AlloyDB | 43 | L4 on Cloud Run, H100 |
| Azure | Container Apps → AKS | AKS, free tier without SLA | Flexible Server HA, replicas | 70+ | H100 |
| Oracle Cloud | VM → OKE | OKE | OCI Database with PostgreSQL | 41 | H100 and newer |
| Hetzner | more servers, by hand | no (k3s on your own) | no, only your own | 6 | dedicated GEX only |
| DigitalOcean | App Platform → DOKS | DOKS, free control plane | Managed PG with standby and replicas | 13 | GPU Droplets |
| Heroku | more dynos | no | up to Premium plans | US, EU | no |
| Render | horizontal autoscaling on Pro | no | up to 128 CPUs and 1 TB RAM | 5 | no |
| Coolify | more servers | no | your own | wherever your servers are | wherever your servers are |
| Alibaba Cloud | SAS → ECS → ACK | ACK | ApsaraDB, PolarDB | 31 | yes |
| Yandex Cloud | Serverless → Managed Kubernetes | yes | Managed PG HA | 1 (+ Kazakhstan) | yes |
| Scaleway | Serverless → Kapsule | Kapsule | Managed PG HA (not DEV) | 3 | H100 |

The conclusion from this table is the opposite of the previous one:

- **The hyperscalers** cost more at the start, but growing inside them means changing services, not providers. Cloud Run → GKE and Container Apps → AKS run the same container.
- **Hetzner and Coolify** are the cheapest while you have one or two servers. After that you either build your own platform or move.
- **A PaaS** is comfortable right up to the moment you need a GPU, an unusual network or a region it doesn't have.

## 10. How not to get stuck

A move is expensive not because of the data transfer but because of what you have to rewrite. The rules that keep the door open:

- **Containers, not buildpacks or functions.** A Docker image runs on Cloud Run, on Render, in Kubernetes and on bare Hetzner. Heroku buildpacks and Lambda functions have to be repackaged.
- **Postgres, not a proprietary database.** RDS, Cloud SQL, Azure Flexible and Yandex's Managed PG all take the same `pg_dump`. Aurora-specific features, Spanner, DynamoDB and Cosmos DB don't.
- **The S3 API for files.** Everyone supports it, from Cloudflare R2 to Yandex Object Storage and MinIO.
- **A queue in Postgres or Redis, not SQS or Pub/Sub**, while the load allows. pg-boss, River and Sidekiq move together with the database.
- **Terraform or OpenTofu from day one.** Even if the provider changes and the modules need rewriting, you'll have an exact inventory of what you built.
- **OpenTelemetry for logs and metrics**, so observability isn't tied to CloudWatch or Stackdriver.
- **Secrets through environment variables.** A wrapper around Secrets Manager is easy to swap later.

And a practical detail: since 2024 AWS, Google and Azure, under pressure from the EU Data Act, waive egress fees when you leave for another provider entirely, on request to support. The traffic itself is no longer the main cost of leaving. Your architecture is.

## 11. Decision tree

- **Users in mainland China?** → a mainland region of Alibaba Cloud (Tencent Cloud for WeChat products, Huawei Cloud for the public sector), ICP filing and a local entity or partner. That is a project with a lawyer.
- **Personal data of Russian citizens?** → Yandex Cloud, Cloud.ru or VK Cloud; choose among them by services and price.
- **Customers in the European public sector, finance or healthcare?** → a sovereign cloud (OVHcloud, Scaleway, STACKIT) or AWS European Sovereign Cloud, depending on what their compliance will accept.
- **No DevOps person on the team?** → a managed PaaS: Render, not Heroku. Watch the bandwidth.
- **Some time to spare and a budget to protect?** → Hetzner + Coolify.
- **Otherwise:**
  - time is worth more than money → Cloud Run or Azure Container Apps, with a clear path to GKE or AKS;
  - money is worth more than time → Hetzner;
  - AWS → if the team already knows it or a big customer requires it.

Whichever branch you take, follow section 10. Then the decision can be revisited.
