const Discord = require("discord.js");
const client = new Discord.Client();
require('discord-buttons')(client);
const { MessageButton, MessageActionRow } = require('discord-buttons');
const { nanoid } = require("nanoid");

const config = require('./config.json');
const exam = require('./exam.json');
const exam_answer = require('./exam_answer.json');
const correct_exam = require('./correct_exam.json');


client.on('ready', () => {
    console.log(`logged in as ${client.user.tag}!`);
    client.user.setActivity(config.prefix + "HELP", {
        type: "STREAMING",
        url: "https://getlinks.co/wp-content/uploads/2018/05/Dev_bg.jpg"
    });
});

const candidate_id = [];
const FakeDatabase = {};


client.on('message', async msg => {
    if (msg.author.bot || msg.guild === null) return
    const pf = config.prefix
    const msgc = msg.content.toLowerCase()
    if (msgc.startsWith(`${pf}`)) {
        if (msgc === `${pf}register`) {

            if (!candidate_id.includes(msg.author.id)) {
                const candidate = {
                    id: msg.author.id,
                    username: msg.author.username,
                    number_of_exams: 1,
                    exam_now: 0,
                    ans_check : false,
                    start_check : false,
                    score: 0,
                    best_score: 0
                }
                candidate_id.push(candidate.id);
                FakeDatabase[candidate.id] = candidate;
                msg.channel.send(`candidate_id: ${candidate.id}\nusername: ${candidate.username}`);
            } else {
                msg.channel.send('your already register');
            }
            console.log(FakeDatabase);
        } else if (msgc === `${pf}start science`) {
            if(candidate_id.includes(msg.author.id)){
                if(FakeDatabase[msg.author.id].start_check===false){
                    FakeDatabase[msg.author.id].start_check = true;
                    await click_btn(msg);
                    msg.channel.send('start the exam with 34 questions in science subject.');
                    const btn  = await test_exam_btn(msg);
                    msg.channel.send(await exam_(msg),
                        { buttons: [btn[0], btn[1], btn[2], btn[3]] }
                    );
                }else{
                    msg.channel.send("your exam is already start ,if u want do next Try: ;next");
                }
            }else{ 
                msg.channel.send("you are not a candidate");
            }

        } else if(msgc===`${pf}next`){
            if (FakeDatabase[msg.author.id]) {
                if (FakeDatabase[msg.author.id].ans_check === true && FakeDatabase[msg.author.id].start_check === true) {
                    next(msg);
                } else {
                    msg.channel.send("You haven't answered the question before.");
                }
            } else {
                msg.channel.send('Try: register');
            }
        }else if(msgc===`${pf}profile`){
            const candidate = FakeDatabase[msg.author.id];
            if(candidate){
                msg.channel.send(`candidate_id: ${candidate.id}\nusername: ${candidate.username}\nexam times: ${candidate.exam_now}\nbest score: ${candidate.best_score}/34`);
            }else{
                msg.channel.send('Try: ;register');
            }
        }else if(msgc===`${pf}help`){
            msg.channel.send(`;register\n;start science\n;next\n;profile`);
        }else{
            msg.channel.send("don't have this commands");
        }
    }

});

// exam
async function exam_(user){
    const now = FakeDatabase[user.author.id].number_of_exams;
    FakeDatabase[user.author.id].number_of_exams = now + 1;
    FakeDatabase[user.author.id].ans_check = false;
    return exam[`exam_${now}`];
}

async function test_exam_btn(user){
    let times = 0;
    const now = FakeDatabase[user.author.id].number_of_exams;
    var btn_arr = [];

    if(exam_answer[`exam_${now}`]){
        exam_answer[`exam_${now}`].forEach(ans => {
            let new_id = `${times}-${nanoid()}`;
            const btn = new MessageButton()
                .setLabel(exam_answer[`exam_${now}`][times])
                .setStyle('green')
                .setID(new_id);

            btn_arr.push(btn);
            times++;
        });
    }
    return btn_arr;
}

// answer btn check
function click_btn(user){
    client.on('clickButton', async btn => {
        await btn.reply.defer();
        await btn.clicker.fetch();

        const now = FakeDatabase[user.author.id].number_of_exams;
        FakeDatabase[user.author.id].ans_check = true;

        const answerID = btn.id.substring(0, btn.id.indexOf('-'));

        if (correct_exam[`exam_${now - 1}`] === answerID) {
            FakeDatabase[user.author.id].score = FakeDatabase[user.author.id].score + 1;
            user.channel.send('✅ Correct!');
        } else {
            user.channel.send('❌ Incorrect!');
        }

        next(user);
    })
}

async function next(msg){
    const btn  = await test_exam_btn(msg);
    const now = FakeDatabase[msg.author.id].number_of_exams;

    if(exam[`exam_${now}`]!==undefined){
        msg.channel.send(await exam_(msg),
            { buttons: [btn[0], btn[1], btn[2], btn[3]] }
        );
    }else{
        msg.channel.send(`Your score is: ${ FakeDatabase[msg.author.id].score}/34`);
        FakeDatabase[msg.author.id].start_check = false;
        FakeDatabase[msg.author.id].exam_now = FakeDatabase[msg.author.id].exam_now + 1;
        if(FakeDatabase[msg.author.id].score>FakeDatabase[msg.author.id].best_score){
            FakeDatabase[msg.author.id].best_score = FakeDatabase[msg.author.id].score;
        }
    }

    
}

client.login(config.key);
