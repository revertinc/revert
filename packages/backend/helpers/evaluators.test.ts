import { evalWithContext } from "./evaluators";

describe("Primitive type evaluations", () => {
  const a = '{"x":{{y}}}';
  const queryNamesInContext = ["y"];

  test("type:string", () => {
    // arrange and act
    const context = { y: "testing" };
    var result = evalWithContext(context, a, queryNamesInContext);

    // assert
    expect(result.x).toBe(context.y);
  });

  test("type:string (multi-line)", () => {
    // arrange and act
    const context = { y: "testing \\n if this works" }; // TODO: Handle single newline characters as well.
    var result = evalWithContext(context, a, queryNamesInContext);

    // assert
    expect(result.x).toBe(context.y);
  });

  test("type:number", () => {
    // arrange and act
    const context = { y: 10 };
    var result = evalWithContext(context, a, queryNamesInContext);

    // assert
    expect(result.x).toBe(context.y);
  });

  test("type:boolean", () => {
    // arrange and act
    const context = { y: true };
    var result = evalWithContext(context, a, queryNamesInContext);

    // assert
    expect(result.x).toBe(context.y);
  });

  test("type:null", () => {
    // arrange and act
    const context = { y: null };
    var result = evalWithContext(context, a, queryNamesInContext);

    // assert
    expect(result.x).toBe(context.y);
  });

  test("type:undefined", () => {
    // arrange and act
    const context = { y: undefined };
    var result = evalWithContext(context, a, queryNamesInContext);

    // assert
    expect(result.x).toBe(context.y);
  });

  test("type:Object", () => {
    // arrange and act
    const context = { y: { a: 10, b: "kasjd" } };
    var result = evalWithContext(context, a, queryNamesInContext);

    // assert
    expect(result.x).toStrictEqual(context.y);
  });
  test("type:BigInt", () => {
    // arrange and act
    const context = { y: BigInt(1000000000) };
    var result = evalWithContext(context, a, queryNamesInContext);

    // assert
    expect(result.x).not.toBe(context.y); // BigInt is treated as string
  });
});

describe("Nested type evaluation", () => {
  const b = '{"a":{"b":{{y}}},"c":1}';
  const queryNamesInContext = ["y"];

  test("type:number", () => {
    // arrange and act
    const context = { y: 10 };
    var result = evalWithContext(context, b, queryNamesInContext);

    // assert
    expect(result.a.b).toBe(context.y);
  });
  test("type:number(within quotes)", () => {
    const c = '{"a":{"b":"{{y}}"},"c":1}';
    // arrange and act
    const context = { y: 10 };
    var result = evalWithContext(context, c, queryNamesInContext);

    // assert
    expect(result.a.b).toBe(String(context.y));
  });
  test("type:number(float)", () => {
    // arrange and act
    const context = { y: 10.01 };
    var result = evalWithContext(context, b, queryNamesInContext);

    // assert
    expect(result.a.b).toBe(context.y);
  });
  test("type:boolean", () => {
    // arrange and act
    const context = { y: true };
    var result = evalWithContext(context, b, queryNamesInContext);

    // assert
    expect(result.a.b).toBe(context.y);
  });
  test("type:null", () => {
    // arrange and act
    const context = { y: null };
    var result = evalWithContext(context, b, queryNamesInContext);

    // assert
    expect(result.a.b).toBe(context.y);
  });
  test("type:undefined", () => {
    // arrange and act
    const context = { y: undefined };
    var result = evalWithContext(context, b, queryNamesInContext);

    // assert
    expect(result.a.b).toBe(context.y);
  });
  test("type:Object", () => {
    // arrange and act
    const context = { y: { a: 10, b: "kasjd" } };
    var result = evalWithContext(context, b, queryNamesInContext);

    // assert
    expect(result.a.b).toStrictEqual(context.y);
  });
});

describe("Nested type evaluation within quotes", () => {
  const c = '{"a":{"b":"{{y}}"},"c":1}';
  const queryNamesInContext = ["y"];

  test("type:number", () => {
    const c = '{"a":{"b":"{{y}}"},"c":1}';
    // arrange and act
    const context = { y: 10 };
    var result = evalWithContext(context, c, queryNamesInContext);

    // assert
    expect(result.a.b).toBe(String(context.y));
    expect(typeof result.a.b).toBe("string");
  });
  test("type:string (multi line, with backslash n )", () => {
    // arrange and act
    const context = { y: "bleh \n test" };
    var result = evalWithContext(context, c, queryNamesInContext, false);

    // assert
    expect(result.a.b).toBe(context.y);
  });
  test("type:string (negative case, with escaped single quotes in double quotes)", () => {
    // arrange and act
    const context = { y: "bleh test \\\\'yes\\\\' " };
    var result = evalWithContext(context, c, queryNamesInContext, false);

    // assert
    expect(result.a.b).not.toEqual(context.y);
  });
  test("type:string (multi line, with backslash n, templatized)", () => {
    const c = '{"a":{"b":{{y}} },"c":1}'; // Should not add quotes if templatized
    // arrange and act
    const context = { y: "bleh \\n test" };
    var result = evalWithContext(context, c, queryNamesInContext);

    // assert
    expect(result.a.b).toBe(context.y);
  });

  test("type:string (gpt3 prompt sample, multi line, with backslash n, templatized)", () => {
    const c = '{"a":{"b":{{y}} },"c":1}'; // Should not add quotes if templatized
    // arrange and act
    const context = {
      y: "Convert this conversation into a summary: \\nU029C6Q4ULE : *Customer Issue* : User is getting the following error while trying to sign up\\n*Ticket ID*: 533628\\n<@U045W9X7NFP> U048WELRWQM : I also heard complains from three other users. Sharing the tickets ids with you.  U02947Q4M0X : Can we get more details about the users? The email id, device type, and browser? U02947Q4M0X : Did we follow the troubleshooting steps: Clearing the cache and then hard reloading the browser? U029C6Q4ULE : You can check the details using the ticket ID mentioned by searching in Freshdesk U02947Q4M0X : Could you help us connect with this user over google meet/anydesk on Monday?\\n\\nWe've been facing this issue since the start, not easily reproducible. U045W9X7NFP : I’m on it. U029C6Q4ULE : Do you want to do a focus group with all Users or individually connect with them? U048WELRWQM : Tested in stage env. Found bugs.   U029C6Q4ULE : What kind of bugs? U048WELRWQM : UI bugs U029C6Q4ULE : That is not a bug <@U048WELRWQM> U029C6Q4ULE : We are talking about real bugs here U029C6Q4ULE : :ladybug::ladybug::ladybug::ladybug::ladybug::ladybug::ladybug: U02947Q4M0X : <@U045W9X7NFP> can you create a JIRA issue for this? we can pick it up in tomorrow's hotfix if the effort is less U029C6Q4ULE : Hot fix is scheduled for Friday not tomorow <@U02947Q4M0X> U029C6Q4ULE : This needs to be fixed outside the scope U029C6Q4ULE : <@U045W9X7NFP> Have you identified the issue here? U02947Q4M0X : Called the customer, he is not comfortable talking in English, he wants someone who can speak to him in Spanish. U029C6Q4ULE : <@U048WELRWQM> Can you learn Spanish from duo lingo in a day? U02947Q4M0X : Also, can we ask for a screen recording of the issue from the user? Will be easier to debug and understand U048WELRWQM : Lets schedule a follow-up with the customer. I can speak español.  U045W9X7NFP : <@U029C6Q4ULE> I’m working on it. Root cause is not known yet. Should take me a couple of hours to find out U029C6Q4ULE : Okay, keep us posted U048WELRWQM : <@U045W9X7NFP> any progress on the RCA? U029C6Q4ULE : I spoke to the customer and they said the sign up flow is working in incognito .\\n",
    };
    var result = evalWithContext(context, c, queryNamesInContext);
    // assert
    expect(result.a.b).toBe(context.y);
  });
  test("type:string (json, multi line, with backstick `, templatized)", () => {
    const c = '{"a":{"b":{{y}} },"c":1}'; // Should not add quotes if templatized
    // arrange and act
    const context = {
      y: '{"type":"message_action","token":"Xv24wHGzT84k6iv68Iw0nXPz","action_ts":"1667717333.534127","team":{"id":"T013K620LTW","domain":"lennysnewsletter"},"user":{"id":"U01TJA2PECU","username":"sandilya.jatin","team_id":"T013K620LTW","name":"sandilya.jatin"},"channel":{"id":"C014516U807","name":"tools-and-pro-tips"},"is_enterprise_install":false,"enterprise":null,"callback_id":"summary_action","trigger_id":"4341732609137.1121206020948.4bc951a13e5b2958bbdddaa5be0539c6","response_url":"https:\\/\\/hooks.slack.com\\/app\\/T013K620LTW\\/4326142909397\\/PB8IHwf9g6Bw7zOU2SZVAVYL","message_ts":"1667121777.539979","message":{"client_msg_id":"cc231cdd-1eef-46d9-92e3-6efb9dbf7deb","type":"message","text":"Anyone dealt with identifying Brave :lion_face: browser users on Analytics platforms yet?\\nI\\u2019m using Heap and LogRocket and on both it seems like Brave sessions are registered as `Browser = Chrome`","user":"U01SX8R7E5T","ts":"1667121777.539979","blocks":[{"type":"rich_text","block_id":"uDz3","elements":[{"type":"rich_text_section","elements":[{"type":"text","text":"Anyone dealt with identifying Brave "},{"type":"emoji","name":"lion_face","unicode":"1f981"},{"type":"text","text":" browser users on Analytics platforms yet?\\nI\\u2019m using Heap and LogRocket and on both it seems like Brave sessions are registered as "},{"type":"text","text":"Browser = Chrome","style":{"code":true}}]}]}],"team":"T013K620LTW","thread_ts":"1667121777.539979","reply_count":8,"reply_users_count":3,"latest_reply":"1667232760.387459","reply_users":["U030X1SB8QH","U01SX8R7E5T","U01GNJMCFHU"],"is_locked":false,"subscribed":false}}',
    };
    var result = evalWithContext(context, c, queryNamesInContext);
    // assert
    expect(JSON.parse(result.a.b)).toStrictEqual(JSON.parse(context.y));
  });
  test('type:string (json, multi line, with doulbe quotes ", templatized)', () => {
    const c = '{"a":{"b":{{y}} },"c":1}'; // Should not add quotes if templatized
    // arrange and act
    const context = {
      y: '{"type":"message_action","token":"Xv24wHGzT84k6iv68Iw0nXPz","action_ts":"1667717262.106465","team":{"id":"T013K620LTW","domain":"lennysnewsletter"},"user":{"id":"U01TJA2PECU","username":"sandilya.jatin","team_id":"T013K620LTW","name":"sandilya.jatin"},"channel":{"id":"C014516U807","name":"tools-and-pro-tips"},"is_enterprise_install":false,"enterprise":null,"callback_id":"summary_action","trigger_id":"4322487807542.1121206020948.8e6f7d82bbac839cc4523469ee37bbf2","response_url":"https:\\/\\/hooks.slack.com\\/app\\/T013K620LTW\\/4331546723492\\/PfDsCirFyCD9vehynM34kM1E","message_ts":"1666856797.361239","message":{"client_msg_id":"aab055dc-5166-4d15-872c-48cbaaf6cfff","type":"message","text":"Has anyone recently implemented <http:\\/\\/customer.io|customer.io>? We\'re trying to connect out segment events as trigger for marketing emails. We\'re trying to figure out:\\nIf  we use the server side events as trigger? - As per <http:\\/\\/Customer.io|Customer.io>, the answer is  \\"yes\\" but then how do we trigger emails for events like abandoned cart? They are client side events. Is there a way to consolidate them?\\nThanks in advance!","user":"U03B1M8TWUS","ts":"1666856797.361239","blocks":[{"type":"rich_text","block_id":"ia3","elements":[{"type":"rich_text_section","elements":[{"type":"text","text":"Has anyone recently implemented "},{"type":"link","url":"http:\\/\\/customer.io","text":"customer.io"},{"type":"text","text":"? We\'re trying to connect out segment events as trigger for marketing emails. We\'re trying to figure out:\\nIf  we use the server side events as trigger? - As per "},{"type":"link","url":"http:\\/\\/Customer.io","text":"Customer.io"},{"type":"text","text":", the answer is  \\"yes\\" but then how do we trigger emails for events like abandoned cart? They are client side events. Is there a way to consolidate them?\\nThanks in advance!"}]}]}],"team":"T013K620LTW","thread_ts":"1666856797.361239","reply_count":6,"reply_users_count":6,"latest_reply":"1667325506.799489","reply_users":["U016Z02Q7QT","U047P1JGD5F","U01GNJMCFHU","U01F8CNM96Y","U0158CRQ04X","U03B1M8TWUS"],"is_locked":false,"subscribed":false}}',
    };
    var result = evalWithContext(context, c, queryNamesInContext);
    // assert
    expect(JSON.parse(result.a.b)).toStrictEqual(JSON.parse(context.y));
  });
});
