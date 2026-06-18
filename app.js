let words = JSON.parse(localStorage.getItem("words")) || [];
let wrongWords = JSON.parse(localStorage.getItem("wrongWords")) || [];

let correctCount = Number(localStorage.getItem("correctCount")) || 0;
let wrongCount = Number(localStorage.getItem("wrongCount")) || 0;

let currentQuiz = null;
let quizMode = "normal";

function saveData() {
  localStorage.setItem("words", JSON.stringify(words));
  localStorage.setItem("wrongWords", JSON.stringify(wrongWords));
  localStorage.setItem("correctCount", correctCount);
  localStorage.setItem("wrongCount", wrongCount);
}

function showSection(sectionId) {
  const sections = document.querySelectorAll(".content-section");

  sections.forEach(function (section) {
    section.classList.add("hidden");
  });

  document.getElementById(sectionId).classList.remove("hidden");

  renderAll();
}

function addWord() {
  const chineseInput = document.getElementById("chineseInput");
  const pinyinInput = document.getElementById("pinyinInput");
  const meaningInput = document.getElementById("meaningInput");
  const addMessage = document.getElementById("addMessage");

  const chinese = chineseInput.value.trim();
  const pinyin = pinyinInput.value.trim();
  const meaning = meaningInput.value.trim();

  if (chinese === "" || pinyin === "" || meaning === "") {
    addMessage.textContent = "중국어 단어, 병음, 한국어 뜻을 모두 입력해주세요.";
    addMessage.className = "message error";
    return;
  }

  const newWord = {
    id: Date.now(),
    chinese: chinese,
    pinyin: pinyin,
    meaning: meaning,
    wrongTimes: 0
  };

  words.push(newWord);

  chineseInput.value = "";
  pinyinInput.value = "";
  meaningInput.value = "";

  addMessage.textContent = "단어가 등록되었습니다.";
  addMessage.className = "message success";

  saveData();
  renderAll();
}

function renderWordTable() {
  const wordTableBody = document.getElementById("wordTableBody");
  wordTableBody.innerHTML = "";

  if (words.length === 0) {
    wordTableBody.innerHTML = `
      <tr>
        <td colspan="5">아직 등록된 단어가 없습니다.</td>
      </tr>
    `;
    return;
  }

  words.forEach(function (word, index) {
    wordTableBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>
          <input value="${escapeHtml(word.chinese)}" 
          onchange="editWord(${word.id}, 'chinese', this.value)" />
        </td>
        <td>
          <input value="${escapeHtml(word.pinyin)}" 
          onchange="editWord(${word.id}, 'pinyin', this.value)" />
        </td>
        <td>
          <input value="${escapeHtml(word.meaning)}" 
          onchange="editWord(${word.id}, 'meaning', this.value)" />
        </td>
        <td>
          <button class="delete-button" onclick="deleteWord(${word.id})">삭제</button>
        </td>
      </tr>
    `;
  });
}

function editWord(id, field, value) {
  const targetWord = words.find(function (word) {
    return word.id === id;
  });

  if (!targetWord) {
    return;
  }

  targetWord[field] = value.trim();

  wrongWords = wrongWords.map(function (wrongWord) {
    if (wrongWord.id === id) {
      wrongWord[field] = value.trim();
    }
    return wrongWord;
  });

  saveData();
  renderAll();
}

function deleteWord(id) {
  words = words.filter(function (word) {
    return word.id !== id;
  });

  wrongWords = wrongWords.filter(function (word) {
    return word.id !== id;
  });

  saveData();
  renderAll();
}

function startQuiz() {
  quizMode = "normal";

  if (words.length === 0) {
    const quizBox = document.getElementById("quizBox");
    quizBox.classList.remove("hidden");
    quizBox.innerHTML = `<p class="message error">먼저 단어를 등록해주세요.</p>`;
    return;
  }

  makeQuestion(words);
}

function startWrongQuiz() {
  quizMode = "wrong";

  const wrongMessage = document.getElementById("wrongMessage");

  if (wrongWords.length === 0) {
    wrongMessage.textContent = "복습할 오답이 없습니다!";
    wrongMessage.className = "message info";
    return;
  }

  wrongMessage.textContent = "오답 재시험을 시작합니다.";
  wrongMessage.className = "message success";

  showSection("quiz-section");
  makeQuestion(wrongWords);
}

function makeQuestion(sourceList) {
  const quizBox = document.getElementById("quizBox");

  quizBox.classList.remove("hidden");

  quizBox.innerHTML = `
    <p class="quiz-label">문제</p>
    <h3 id="quizMeaning"></h3>

    <div class="input-box">
      <label for="answerChinese">중국어 단어</label>
      <input id="answerChinese" type="text" placeholder="중국어 단어 입력" />
    </div>

    <div class="input-box">
      <label for="answerPinyin">병음</label>
      <input id="answerPinyin" type="text" placeholder="병음 입력" />
    </div>

    <button class="main-button" onclick="checkAnswer()">제출</button>
    <button class="sub-button" onclick="nextQuestion()">다음 문제</button>

    <p id="quizResult" class="message"></p>
  `;

  const randomIndex = Math.floor(Math.random() * sourceList.length);
  currentQuiz = sourceList[randomIndex];

  document.getElementById("quizMeaning").textContent = currentQuiz.meaning;
}

function checkAnswer() {
  const answerChinese = document.getElementById("answerChinese").value.trim();
  const answerPinyin = document.getElementById("answerPinyin").value.trim();
  const quizResult = document.getElementById("quizResult");

  if (currentQuiz === null) {
    quizResult.textContent = "먼저 시험을 시작해주세요.";
    quizResult.className = "message error";
    return;
  }

  if (answerChinese === "" || answerPinyin === "") {
    quizResult.textContent = "중국어 단어와 병음을 모두 입력해주세요.";
    quizResult.className = "message error";
    return;
  }

  const chineseCorrect = normalize(answerChinese) === normalize(currentQuiz.chinese);
  const pinyinCorrect = normalize(answerPinyin) === normalize(currentQuiz.pinyin);

  if (chineseCorrect && pinyinCorrect) {
    correctCount++;

    quizResult.textContent = "정답입니다!";
    quizResult.className = "message success";

    if (quizMode === "wrong") {
      removeFromWrongWords(currentQuiz.id);
    }
  } else {
    wrongCount++;

    quizResult.innerHTML = `
      오답입니다.<br>
      정답: ${currentQuiz.chinese} / ${currentQuiz.pinyin} / ${currentQuiz.meaning}
    `;
    quizResult.className = "message error";

    addToWrongWords(currentQuiz);
  }

  saveData();
  renderAll();
}

function nextQuestion() {
  if (quizMode === "wrong") {
    if (wrongWords.length === 0) {
      const quizResult = document.getElementById("quizResult");
      quizResult.textContent = "복습할 오답이 없습니다!";
      quizResult.className = "message info";
      return;
    }

    makeQuestion(wrongWords);
  } else {
    if (words.length === 0) {
      return;
    }

    makeQuestion(words);
  }
}

function addToWrongWords(word) {
  const originalWord = words.find(function (item) {
    return item.id === word.id;
  });

  if (originalWord) {
    originalWord.wrongTimes = originalWord.wrongTimes + 1;
  }

  const alreadyWrong = wrongWords.find(function (item) {
    return item.id === word.id;
  });

  if (alreadyWrong) {
    alreadyWrong.wrongTimes = alreadyWrong.wrongTimes + 1;
  } else {
    wrongWords.push({
      id: word.id,
      chinese: word.chinese,
      pinyin: word.pinyin,
      meaning: word.meaning,
      wrongTimes: 1
    });
  }
}

function removeFromWrongWords(id) {
  wrongWords = wrongWords.filter(function (word) {
    return word.id !== id;
  });
}

function renderWrongTable() {
  const wrongTableBody = document.getElementById("wrongTableBody");
  wrongTableBody.innerHTML = "";

  if (wrongWords.length === 0) {
    wrongTableBody.innerHTML = `
      <tr>
        <td colspan="5">아직 오답이 없습니다.</td>
      </tr>
    `;
    return;
  }

  wrongWords.forEach(function (word, index) {
    wrongTableBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${word.chinese}</td>
        <td>${word.pinyin}</td>
        <td>${word.meaning}</td>
        <td>${word.wrongTimes}</td>
      </tr>
    `;
  });
}

function renderRecord() {
  const totalWords = document.getElementById("totalWords");
  const correctCountBox = document.getElementById("correctCount");
  const wrongCountBox = document.getElementById("wrongCount");
  const accuracyRate = document.getElementById("accuracyRate");
  const mostWrongWord = document.getElementById("mostWrongWord");

  const totalSolved = correctCount + wrongCount;
  let accuracy = 0;

  if (totalSolved > 0) {
    accuracy = Math.round((correctCount / totalSolved) * 100);
  }

  totalWords.textContent = words.length;
  correctCountBox.textContent = correctCount;
  wrongCountBox.textContent = wrongCount;
  accuracyRate.textContent = accuracy + "%";

  if (wrongWords.length === 0) {
    mostWrongWord.textContent = "아직 기록이 없습니다.";
    return;
  }

  let mostWrong = wrongWords[0];

  wrongWords.forEach(function (word) {
    if (word.wrongTimes > mostWrong.wrongTimes) {
      mostWrong = word;
    }
  });

  mostWrongWord.textContent = `${mostWrong.chinese} / ${mostWrong.pinyin} / ${mostWrong.meaning} (${mostWrong.wrongTimes}회)`;
}

function renderAll() {
  renderWordTable();
  renderWrongTable();
  renderRecord();
}

function normalize(text) {
  return text.toLowerCase().replace(/\s/g, "");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

renderAll();
