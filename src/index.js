const {Client, IntentsBitField} = require("discord.js");
const {token} = require("../config.json");
const fs = require('fs');
var user_scores = {};

/**
 * Add to user_scores
 * @param {*} name -> Username 
 * @param {*} time -> Timestamp
 * @returns 
 */
function addToUsers(name, time) {
    if (name == "MeowBot") return false;;
    if (!(name in user_scores)) {
        user_scores[name] = {"score" : 1, "last_sent" : time};
        console.log("New name added!");
        return true;
    }
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
    let contents = "";
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
});

client.on('messageCreate', (msg) => {
    if (msg.channel.name == "hourly-meow") {
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
        }
        if (msg.content == "!meowboards") {
            let out = "";
			let timeToDelete = 20000;
            out += "# Meowboards!\n";
            out += "_Only meows every hour count_\n";
            out += ""

            // Display array
            var disp_arr = [];
            for (var i in user_scores) {
                // Giga Jick workaround for JSON Object sorting
                disp_arr.push(
                    JSON.parse(`{"name": "${i}","score":${user_scores[i].score}}`
                    ));
            }

            // Sort by descending
            disp_arr.sort(function(a, b) {
                return b.score - a.score;
            });

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
                setTimeout(() => repliedMsg.delete().then(msg.delete()), timeToDelete);
            });
        }
        else if (msg.content.toLowerCase().includes("meow")) {
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
    }
});

client.login(token);
