const robot = require('robotjs');
const clipboardy = require('clipboardy');
const firebase = require('firebase');
require('firebase/firestore');
var config = {
    apiKey: "AIzaSyBiYZydN2cvoqW0K3g5QBnd3HYzmndeUxE",
    authDomain: "group-trivia.firebaseapp.com",
    databaseURL: "https://group-trivia.firebaseio.com",
    projectId: "group-trivia",
    storageBucket: "group-trivia.appspot.com",
    messagingSenderId: "43592979053"
};
firebase.initializeApp(config);

const wait = async (time) => new Promise((resolve) => setTimeout(resolve, time));

const db = firebase.firestore();
const settings = {timestampsInSnapshots: true};
db.settings(settings);

const checkedAnswers = {

};

const unprocessedAnswers = [];

const attemptAnswer = async () => {
    const answerObj = unprocessedAnswers.pop();
    if (!answerObj || checkedAnswers[answerObj.id]) {
        setTimeout(attemptAnswer, 300);
        return;
    }
    const data = answerObj.data();
    const answer = data.answer;
    checkedAnswers[answerObj.id] = answer;
    console.log("Processing", answer);
    // robot.typeString(answer);
    await wait(100);
    // robot.keyTap("a", "command");
    // robot.keyTap("c", "command");
    await wait(100);
    // robot.keyTap("backspace");
    const finalAnswer = clipboardy.readSync();
    if (finalAnswer.length !== answer.length) {
        console.log(answer, "was CORRECT");
        data.correct = true;
    } else {
        console.log(answer, "was not correct");
        data.correct = false;
    }
    data.processed = true;
    setTimeout(attemptAnswer, 100);
    return answerObj.ref.set(data)
        .catch(console.error)
        .then();
    if (data.correct === true) {
        db.collection('players').doc(data.name).get()
            .then((obj) => {
                const newObj = obj.data();
                newObj.points += 1;
                obj.ref.set(newObj);
            })
            .catch(console.error);
    }
}


const beginProcessing = async () => {
    console.log('Starting up...');
    await wait(5000);
    console.log('Processing answers.');
    db.collection('answers').where('processed', '==', false)
        .onSnapshot((res) => {
            res.forEach((obj) => {
                unprocessedAnswers.unshift(obj);
                // await attemptAnswer(obj);
            })
        })
};

beginProcessing();
attemptAnswer();