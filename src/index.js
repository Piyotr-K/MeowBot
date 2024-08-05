const {Client, IntentsBitField} = require("discord.js");
const {token, TestGuild} = require("../config.json");
const {BetaTester} = require("../config.json");
const fs = require('fs');
var user_scores = {};
/**
 * Add to user_scores
 * @param {*} name -> Username 
 * @param {*} time -> Timestamp
 * @returns true or false based on whether or not a new name was added.
 */
function addToUsers(name, time) {
    if (name == "MeowBot") return false;;
    if (!(name in user_scores)) {
        user_scores[name] = {"score" : 1, "last_sent" : time};
        console.log("New name added!");
        return true;
    }
    return false;
}

/**
 * 
 * @param {*} timestamp -> Timestamp to convert
 * @param {*} mode What to return, 0 - year, 1 - Month, 2 - Date, 3 - Hour, 4 - Minute, 5 - Seconds
 */
function convertToTime(timestamp, mode) {
    let tmp = new Date(timestamp);
    const vals = [
        tmp.getFullYear(),
        tmp.getMonth() + 1,
        tmp.getDate(),
        tmp.getHours(),
        tmp.getMinutes(),
        tmp.getSeconds(),
    ];
    // console.log(vals);
    return vals[mode];
}

function read_scores(f_name) {
    var contents = "";
    fs.readFile(f_name, "utf-8", (err, jsonString)=> {
        if (err) {
            console.log("File read failed: " + err);
            return;
        }
        user_scores = JSON.parse(jsonString);
        contents = jsonString;
    });
    console.log("File data: " + contents);
}

/**
 * Function for sorting the user_scores array in descending order
 * @returns 
 */
function sort_leaderboards() {
    var out = [];

    for (var i in user_scores) {
        // Giga Yek workaround for JSON Object sorting
        out.push(
            JSON.parse(`{"name": "${i}","score":${user_scores[i].score}}`
            ));
    }

    // Sort by descending
    out.sort(function(a, b) {
        return b.score - a.score;
    });

    return out;
}

/**
 * Function to handle hourly-meow channel based messages
 * @param {*} msg 
 * @returns 
 */
function handle_hourly(msg) {
    if (msg.content == "!meowboards") {
        // reply_leaderboards();
    }
    else if (msg.content.toLowerCase().includes("meow")) {
        if (addToUsers(msg.author.username, msg.createdTimestamp)) {
            msg.react('😺').catch(console.error);
            // Update database
            fs.writeFile("data.json", JSON.stringify(user_scores), 'utf-8', err => {
                if (err) {
                    console.log('Error writing file', err)
                } else {
                    console.log('Successfully wrote file')
                }
            });
        } else {
        // handle_meow(msg);
        }
    }
}

/**
 * Handles meows based on the message
 * 
 * Accesses global user_scores
 * Writes to data.json
 * @returns 
 */
function handle_meow(msg) {
    u_name = msg.author.username

    // Ignore meowbot messages
    if (u_name == "MeowBot") return;

    let curr_msg_t = msg.createdTimestamp;
    let last_msg_t = user_scores[u_name]["last_sent"];
    let diff = Math.floor((curr_msg_t - last_msg_t) / 1000);
    console.log("Username: " + u_name);
    console.log("Difference in seconds: " + diff);
    // 3600 to convert to hours
    if (diff >= 3600) {
        msg.react('😺').catch(console.error);

        // Update user info
        user_scores[u_name].score = parseInt(user_scores[u_name].score) + 1;

        // Update last meow sent
        user_scores[u_name]["last_sent"] = msg.createdTimestamp;

        // Update scores everytime
        fs.writeFile("data.json", JSON.stringify(user_scores), 'utf-8', err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file')
            }
        });
    } else {
        let out = `You must wait ${60 - Math.floor(diff / 60)} minutes before the next meow will count!`;
        msg.reply(out);
        // msg.reply(out).then(repliedMsg => {
        //     setTimeout(() => repliedMsg.delete().then(), 5000);
        // });
    }
}

/**
 * Display leaderboards (Meowboards) as a reply
 */
function reply_leaderboards() {
    let out = "";
    out += "# Meowboards!\n";
    out += "_Only meows every hour count_\n";
    out += ""

    // Display array
    var disp_arr = [];
    disp_arr = sort_leaderboards();

    // Top meower
    out += "## Top meower:\n";
    out += "## 🥇🐈 - " + disp_arr[0].name + " has meowed _" + disp_arr[0].score + "_ time(s)!\n";
    // console.log(disp_arr);
    for (let i = 1; i < disp_arr.length; i++) {
        out += "### 🐈 - " + disp_arr[i].name + " has meowed _" + disp_arr[i].score + "_ time(s)!\n";
    }
    out += "\n";
    // Delete the leaderboards message after 5 seconds
    // Then delete the original !meowboards message
    msg.reply(out).then(repliedMsg => {
        setTimeout(() => repliedMsg.delete().then(msg.delete()), 5000);
    });
}

/**
 * Send leaderboards as a message to a channel
 */
function send_leaderboards(channel) {
    let out = "";
    out += "# Meowboards 🐈\n";
    out += "_Final Scores!_\n";
    out += ""

    // Display array
    var disp_arr = [];
    disp_arr = sort_leaderboards();

    // Top meower
    out += "## Top meowers:\n";
    out += "# 🥇🐈 - " + disp_arr[0].name + " has meowed _" + disp_arr[0].score + "_ time(s)!\n";
    out += "## 🥈🐈 - " + disp_arr[1].name + " has meowed _" + disp_arr[1].score + "_ time(s)!\n";
    out += "### 🥉🐈 - " + disp_arr[2].name + " has meowed _" + disp_arr[2].score + "_ time(s)!\n";
    // console.log(disp_arr);
    for (let i = 3; i < disp_arr.length; i++) {
        out += "🐈 - " + disp_arr[i].name + " has meowed _" + disp_arr[i].score + "_ time(s)!\n";
    }
    out += "\n";

    out += "The winners of the meow-art competition were:\n";
    out += "## hynnnl (+10 meows)\n";
    out += "### thehumanpizza (+10 meows)\n";
    out += "### gordysmurf (+10 meows) (But he didnt meow so it doesnt count sad)\n";

    out += "### The Overall winner is:\n";
    out += `# 🐈 ${BetaTester} 🐈\n`;

    out += "_Thanks everyone for participating in brain rot meowage, the meowbot will return..._\n";

    channel.send(out);
}

function startup() {
    const guild = client.guilds.fetch(TestGuild);

    if (guild) {
        const channel = client.channels.cache.find(channel => channel.name === "hourly-meow");
        if (channel)
            send_leaderboards(channel);
        else console.log("No channel with that name!");
    } else {
        console.log("No Guild with the given ID!");
    }
}

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});



client.on('ready', (c) => {
    console.log("Ready!");
    console.log(`${c.user.tag} is online.`);
    console.log("Reading user scores");
    read_scores("data.json");
    // startup();
});



client.on('messageCreate', (msg) => {
    if (msg.author.username == BetaTester) {
        let m = msg.content.split(" ");
        if (m[0] == "!meowbot") {
            if (m[1] == "help") {
                let out = "";
                out += "### Available commands: \n";
                out += "> **meow** | Meowbot will reply with a meow\n";
                out += "> **say** _messageHere_ | Meowbot will reply with the same message back\n";
                out += "\n_more functions to come later_";
                msg.reply(out);
            } else if (m[1] == "meow") {
                msg.reply("## Meow!");
            } else if (m[1] == "say") {
                msg.reply(`"## ${m[2]}!"`);
            } else {
                msg.reply("Need help? Type !meowbot help");
            }
        }
    }
    if (msg.channel.name == "hourly-meow") {
        // handle_hourly(msg);
        if (msg.content == "!finalstats") {
            send_leaderboards(msg.channel);
        }
    }
});

client.login(token);
