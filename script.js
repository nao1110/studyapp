document.addEventListener('DOMContentLoaded', () => {
    // === HTML要素の取得 ===
    // 各入力フィールドやボタン、表示領域のHTML要素をJavaScriptで操作するためにIDを使って取得します。
    const studySubjectInput = document.getElementById('studySubject'); // 学習内容入力欄 (目標設定用)
    const targetHoursInput = document.getElementById('targetHours');   // 目標時間入力欄
    const addStudySubjectBtn = document.getElementById('addStudySubjectBtn'); // 学習内容追加/更新ボタン
    const clearGoalInputBtn = document.getElementById('clearGoalInputBtn'); // 目標設定クリアボタン
    const subjectMessage = document.getElementById('subjectMessage'); // 学習内容のメッセージ表示エリア

    const currentStudySubjectSelect = document.getElementById('currentStudySubject'); // 日々の学習内容選択ドロップダウン
    const studyDateInput = document.getElementById('studyDate');     // 学習日入力欄
    const studyTimeInput = document.getElementById('studyTime');     // 学習時間入力欄
    const studyNotesTextarea = document.getElementById('studyNotes'); // 学習メモ入力欄
    const recordStudyBtn = document.getElementById('recordStudyBtn'); // 学習記録ボタン
    const clearRecordInputBtn = document.getElementById('clearRecordInputBtn'); // 学習記録クリアボタン
    const recordMessage = document.getElementById('recordMessage'); // 学習記録のメッセージ表示エリア

    const overallProgressDiv = document.getElementById('overallProgress'); // 全体の進捗表示エリア
    const subjectProgressListDiv = document.getElementById('subjectProgressList'); // 各学習内容の進捗リスト表示エリア
    const filterSubjectSelect = document.getElementById('filterSubject'); // 履歴絞り込み用ドロップダウン
    const studyHistoryList = document.getElementById('studyHistoryList'); // 学習履歴リスト

    // === データ管理用の変数 ===
    // 学習内容（資格など）とその目標時間を保存するオブジェクト
    // 例: { "JavaScript": { target: 100, current: 0 }, "TOEIC": { target: 200, current: 0 } }
    let studyGoals = {};

    // 日々の学習記録を保存する配列
    // 例: [{ id: 123, subject: "JavaScript", date: "2023-01-01", time: 1.5, notes: "基礎を学習" }]
    let studyRecords = [];

    let editingRecordId = null; // 編集中（更新モード）の学習記録のIDを保持。nullの場合は新規記録。

    // === localStorageからデータを読み込む関数 ===
    // アプリが起動したときやページが更新されたときに、以前保存したデータを読み込みます。
    const loadData = () => {
        // 'studyGoals'というキーで保存されている学習目標データを取得し、JSON形式からJavaScriptオブジェクトに変換します。
        const storedGoals = localStorage.getItem('studyGoals');
        if (storedGoals) {
            studyGoals = JSON.parse(storedGoals);
        }

        // 'studyRecords'というキーで保存されている学習記録データを取得し、JSON形式からJavaScript配列に変換します。
        const storedRecords = localStorage.getItem('studyRecords');
        if (storedRecords) {
            studyRecords = JSON.parse(storedRecords);
        }

        // 読み込んだデータを画面に表示します。
        updateStudySubjectOptions(); // 学習内容のドロップダウンを更新
        renderProgress(); // 進捗状況を更新
        renderHistory(); // 学習履歴を更新
    };

    // === データをlocalStorageに保存する関数 ===
    // データが変更されるたびに、最新の状態をlocalStorageに保存します。
    const saveData = () => {
        // studyGoalsオブジェクトをJSON文字列に変換して保存
        localStorage.setItem('studyGoals', JSON.stringify(studyGoals));
        // studyRecords配列をJSON文字列に変換して保存
        localStorage.setItem('studyRecords', JSON.stringify(studyRecords));
    };

    // === メッセージを表示するヘルパー関数 ===
    // ユーザーに処理の結果を一時的に表示します。
    const displayMessage = (element, message, type = 'success') => {
        element.textContent = message;
        element.className = 'message ' + type; // クラスを追加して色や背景を変える
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 3000); // 3秒後にメッセージを消す
    };

    // === 学習内容選択ドロップダウンとフィルタードロップダウンを更新する関数 ===
    // 新しい学習内容が追加されたり削除されたりした際に、ドロップダウンの選択肢を更新します。
    const updateStudySubjectOptions = () => {
        // ドロップダウンリストの内容を一旦クリア
        currentStudySubjectSelect.innerHTML = '<option value="">--選択してください--</option>';
        filterSubjectSelect.innerHTML = '<option value="">--すべて--</option>';

        // studyGoalsオブジェクトのキー（学習内容名）をループ処理
        // Object.keys(studyGoals)は、studyGoalsオブジェクトのすべてのキー（学習内容名）の配列を返します。
        Object.keys(studyGoals).forEach(subject => {
            // 日々の学習記録用ドロップダウンに選択肢を追加
            const option1 = document.createElement('option');
            option1.value = subject;
            option1.textContent = subject;
            currentStudySubjectSelect.appendChild(option1);

            // 履歴絞り込み用ドロップダウンに選択肢を追加
            const option2 = document.createElement('option');
            option2.value = subject;
            option2.textContent = subject;
            filterSubjectSelect.appendChild(option2);
        });
    };

    // === 進捗状況をレンダリングする関数 ===
    // 各学習内容の進捗と、全体の累計時間を計算して表示します。
    const renderProgress = () => {
        subjectProgressListDiv.innerHTML = ''; // 各学習内容の進捗リストをクリア
        let totalAchievedHours = 0; // 全体の累計学習時間

        // 各学習内容の進捗を計算して表示
        for (const subject in studyGoals) {
            let currentHours = 0;
            // その学習内容に関する全ての記録を合計
            studyRecords.forEach(record => {
                if (record.subject === subject) {
                    currentHours += parseFloat(record.time); // 時間は数値として扱う
                }
            });

            // studyGoalsオブジェクトに現在の累計時間を更新（これで次回ロード時も正確な累計がわかる）
            studyGoals[subject].current = currentHours;

            // 目標時間に対する達成率を計算
            const target = parseFloat(studyGoals[subject].target);
            const percentage = target > 0 ? (currentHours / target * 100).toFixed(1) : 0; // 小数点以下1桁まで

            // 各学習内容の進捗アイテムを作成
            const progressItem = document.createElement('div');
            progressItem.classList.add('subject-progress-item');
            progressItem.innerHTML = `
                <span><strong>${subject}:</strong> ${currentHours.toFixed(1)}時間 / ${target.toFixed(1)}時間</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(parseFloat(percentage), 100)}%;"></div>
                </div>
                <span class="progress-text">${percentage}%</span>
            `;
            subjectProgressListDiv.appendChild(progressItem);

            totalAchievedHours += currentHours; // 全体の累計に加算
        }

        // 全体の進捗を表示
        overallProgressDiv.innerHTML = `
            <p><strong>合計学習時間:</strong> ${totalAchievedHours.toFixed(1)}時間</p>
        `;
    };

    // === 学習履歴をレンダリングする関数 ===
    // 記録された学習履歴を一覧で表示します。絞り込み機能も考慮します。
    const renderHistory = () => {
        studyHistoryList.innerHTML = ''; // リストをクリア

        // 絞り込み対象の学習内容を取得（未選択なら'--すべて--'）
        const filterSubject = filterSubjectSelect.value;

        // 最新の記録が上に来るように、配列を逆順にコピーしてループ
        // [...studyRecords] は、元の配列を変更しないために新しい配列を作成するスプレッド構文です。
        [...studyRecords].reverse().forEach(record => {
            // 絞り込みが有効で、かつ現在のレコードの学習内容がフィルターと一致しない場合はスキップ
            if (filterSubject && record.subject !== filterSubject) {
                return;
            }

            const listItem = document.createElement('li');
            listItem.setAttribute('data-id', record.id); // 編集・削除用にIDをデータ属性として追加

            // 表示するHTMLの内容
            listItem.innerHTML = `
                <p><strong>学習日:</strong> ${record.date}</p>
                <p><strong>学習内容:</strong> ${record.subject} (${record.time}時間)</p>
                <p><strong>メモ:</strong> ${record.notes || 'なし'}</p>
                <div class="record-actions">
                    <button class="edit-btn">編集</button>
                    <button class="delete-btn">削除</button>
                </div>
            `;
            studyHistoryList.appendChild(listItem);

            // 編集ボタンのイベントリスナー
            listItem.querySelector('.edit-btn').addEventListener('click', () => {
                editRecord(record.id);
            });

            // 削除ボタンのイベントリスナー
            listItem.querySelector('.delete-btn').addEventListener('click', () => {
                deleteRecord(record.id);
            });
        });
    };

    // === 目標設定セクションの入力欄をクリアする関数 ===
    const clearGoalInputFields = () => {
        studySubjectInput.value = '';
        targetHoursInput.value = '';
        addStudySubjectBtn.textContent = '学習内容を追加/更新'; // ボタンのテキストを元に戻す
    };

    // === 日々の学習記録セクションの入力欄をクリアする関数 ===
    const clearRecordInputFields = () => {
        currentStudySubjectSelect.value = ''; // ドロップダウンは初期値に戻す
        studyDateInput.value = '';
        studyTimeInput.value = '';
        studyNotesTextarea.value = '';
        editingRecordId = null; // 編集モードを解除
        recordStudyBtn.textContent = '学習を記録'; // ボタンのテキストを元に戻す
    };

    // === 学習内容の追加/更新ボタンクリック時の処理 ===
    addStudySubjectBtn.addEventListener('click', () => {
        const subject = studySubjectInput.value.trim(); // 学習内容の入力値を取得し、前後の空白を除去
        const target = parseFloat(targetHoursInput.value); // 目標時間の入力値を取得し、数値に変換

        if (!subject) {
            displayMessage(subjectMessage, '学習内容を入力してください。', 'error');
            return; // 処理を中断
        }
        if (isNaN(target) || target <= 0) { // 目標時間が無効な数値、または0以下の場合
            displayMessage(subjectMessage, '有効な目標時間を入力してください (0より大きい数値)。', 'error');
            return; // 処理を中断
        }

        // 既存の学習内容があれば更新、なければ新規追加
        // studyGoalsオブジェクトに、学習内容名をキーとして目標時間を保存します。
        // 例: studyGoals["JavaScript"] = { target: 100 }
        studyGoals[subject] = { target: target };
        
        saveData(); // データ保存
        updateStudySubjectOptions(); // 学習内容のドロップダウンを更新
        renderProgress(); // 進捗を再計算して表示
        clearGoalInputFields(); // 入力欄をクリア
        displayMessage(subjectMessage, `'${subject}' の目標が設定/更新されました。`);
    });

    // === 目標設定クリアボタンクリック時の処理 ===
    clearGoalInputBtn.addEventListener('click', clearGoalInputFields);

    // === 学習記録ボタンクリック時の処理 ===
    recordStudyBtn.addEventListener('click', () => {
        const subject = currentStudySubjectSelect.value; // 選択された学習内容
        const date = studyDateInput.value; // 学習日
        const time = parseFloat(studyTimeInput.value); // 学習時間（数値）
        const notes = studyNotesTextarea.value.trim(); // 学習メモ

        // 必須入力項目のチェック
        if (!subject || !date || isNaN(time) || time <= 0) {
            displayMessage(recordMessage, '学習内容、学習日、学習時間は必須です。', 'error');
            return;
        }

        if (editingRecordId !== null) { // 編集モードの場合
            // 編集中のレコードをstudyRecords配列から見つける
            const recordIndex = studyRecords.findIndex(rec => rec.id === editingRecordId);
            if (recordIndex !== -1) {
                // 見つかったレコードの情報を新しい値で更新
                studyRecords[recordIndex] = {
                    id: editingRecordId, // IDは変更しない
                    subject: subject,
                    date: date,
                    time: time,
                    notes: notes,
                    recordedAt: studyRecords[recordIndex].recordedAt // 作成日時を保持
                };
            }
        } else { // 新規記録モード
            // 新しい学習記録オブジェクトを作成
            const newRecord = {
                id: Date.now(), // ユニークなID（現在のタイムスタンプ）
                subject: subject,
                date: date,
                time: time,
                notes: notes,
                recordedAt: new Date().toLocaleString() // 記録された日時を保存
            };
            studyRecords.push(newRecord); // 配列の末尾に追加
        }

        saveData(); // データ保存
        renderProgress(); // 進捗更新
        renderHistory(); // 履歴更新
        clearRecordInputFields(); // 入力欄クリア
        displayMessage(recordMessage, '学習記録が保存されました！');
    });

    // === 学習記録クリアボタンクリック時の処理 ===
    clearRecordInputBtn.addEventListener('click', clearRecordInputFields);

    // === 学習記録の編集関数 ===
    const editRecord = (id) => {
        // 指定されたIDの学習記録をstudyRecords配列から見つける
        const recordToEdit = studyRecords.find(record => record.id === id);
        if (recordToEdit) {
            // 見つかった記録のデータを日々の学習記録フォームにセット
            currentStudySubjectSelect.value = recordToEdit.subject;
            studyDateInput.value = recordToEdit.date;
            studyTimeInput.value = recordToEdit.time;
            studyNotesTextarea.value = recordToEdit.notes;

            editingRecordId = id; // 編集中のIDをセットし、編集モードにする
            recordStudyBtn.textContent = '記録を更新'; // ボタンのテキストを「記録を更新」に変更
            currentStudySubjectSelect.focus(); // 学習内容選択にフォーカスを移動
        }
    };

    // === 学習記録の削除関数 ===
    const deleteRecord = (id) => {
        if (confirm('この学習記録を削除しますか？')) {
            // 削除対象のIDと一致しないレコードだけで新しい配列を作成
            studyRecords = studyRecords.filter(record => record.id !== id);
            saveData(); // データ保存
            renderProgress(); // 進捗更新
            renderHistory(); // 履歴更新
            // もし削除した記録が、たまたま現在編集中の記録だったら
            if (editingRecordId === id) {
                clearRecordInputFields(); // 入力欄をクリアして編集モードを解除
            }
            displayMessage(recordMessage, '学習記録が削除されました。');
        }
    };

    // === フィルタードロップダウン変更時の処理 ===
    // 絞り込みの選択肢が変更されたら、履歴を再レンダリングします。
    filterSubjectSelect.addEventListener('change', renderHistory);

    // === アプリの初期化 ===
    // ページが完全にロードされたときに、すべてのデータをlocalStorageから読み込み、
    // 画面に初期表示を行います。
    loadData();
});