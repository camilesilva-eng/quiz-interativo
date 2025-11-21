const questions = [
    {
        question: "Qual é o maior planeta do Sistema Solar?",
        answers: ["Terra", "Marte", "Júpiter", "Vênus"],
        correct: 2
    },
    {
        question: "Quem descobriu o Brasil?",
        answers: ["Pedro Álvares Cabral", "Cristóvão Colombo", "Dom Pedro I", "Vasco da Gama"],
        correct: 0
    },
    {
        question: "Qual país venceu a Copa de 2002?",
        answers: ["Alemanha", "Brasil", "Argentina", "Itália"],
        correct: 1
    }
];

let index = 0;
let score = 0;

function loadQuestion() {
    document.getElementById("nextBtn").style.display = "none";
    const q = questions[index];

    document.getElementById("question").innerText = q.question;
    document.getElementById("answers").innerHTML = "";

    q.answers.forEach((resposta, i) => {
        const btn = document.createElement("button");
        btn.innerText = resposta;
        btn.onclick = () => checkAnswer(i, btn);
        document.getElementById("answers").appendChild(btn);
    });
}

function checkAnswer(i, btn) {
    const q = questions[index];
    const buttons = document.querySelectorAll("#answers button");

    buttons.forEach(b => b.disabled = true);

    if (i === q.correct) {
        btn.classList.add("correct");
        score++;
    } else {
        btn.classList.add("wrong");
        buttons[q.correct].classList.add("correct");
    }

    document.getElementById("nextBtn").style.display = "block";
}

function nextQuestion() {
    index++;
    if (index >= questions.length) {
        finishQuiz();
    } else {
        loadQuestion();
    }
}

function finishQuiz() {
    document.getElementById("question").style.display = "none";
    document.getElementById("answers").style.display = "none";
    document.getElementById("nextBtn").style.display = "none";

    document.getElementById("final").style.display = "block";
    document.getElementById("scoreText").innerText =
        `Você acertou ${score} de ${questions.length} perguntas!`;
}

function restart() {
    index = 0;
    score = 0;

    document.getElementById("question").style.display = "block";
    document.getElementById("answers").style.display = "block";
    document.getElementById("final").style.display = "none";

    loadQuestion();
}

loadQuestion();

