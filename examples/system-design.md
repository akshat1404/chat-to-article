# Sample chat: learning system design

**m1 User:** Help me learn system design for interviews.

**m2 Assistant:** Start with the building blocks: load balancers, caching, rate limiting, and databases. Then study how they work together through real systems like Uber, because interviewers care about how components interact.

**m3 User:** Ok, let's start with load balancers.

**m4 Assistant:** A load balancer sits in front of your servers and spreads incoming requests across them, so no single server gets overloaded. Common strategies are round robin (each server in turn) and least connections (the server with the fewest active requests).

**m5 User:** I still don't get why we need it. Can't the server just handle more requests?

**m6 Assistant:** A single server has hard limits on CPU and memory. Making it bigger (vertical scaling) gets expensive and still leaves one point of failure. Adding more servers (horizontal scaling) needs something to decide which server gets each request. That's the load balancer.

**m7 User:** I'm still confused about where it actually sits and what it does differently from the server.

**m8 Assistant:** Think of a restaurant host. Customers don't walk into the kitchen and pick a chef. The host at the door looks at which tables and chefs are free and seats each customer. The host cooks nothing. The load balancer is the host: it doesn't run your app, it only routes requests to servers that do.

**m9 User:** Oh, now it makes sense! It's just the host at the door. Finally.

**m10 Assistant:** Exactly. Next is caching: storing the result of an expensive operation so repeated requests are answered fast, without redoing the work.

**m11 User:** Does frontend also have system design? I always thought it was only a backend thing.

**m12 Assistant:** It does. Frontend system design covers bundle size (how much JavaScript the browser downloads), rendering strategy (server vs client rendering), real-time updates through WebSockets (a connection that stays open so the server can push data), and micro-frontends (splitting one large app into independently deployed pieces).

**m13 User:** Wow, I didn't realise that. So frontend has its own scaling problems too.
