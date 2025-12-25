<?php
require_once __DIR__ . "/db.php";

/*
  classroom から「教室ID」と「教室名」を取得する
  画面には教室名だけ表示し、内部で room_id を保持する（JS用）
*/
$sql = "SELECT classroom_id, classroom_name FROM classroom ORDER BY classroom_id";
$stmt = $pdo->prepare($sql);
$stmt->execute();
$rooms = $stmt->fetchAll(); // [["classroom_id"=>..., "classroom_name"=>...], ...]
?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>教室予約システム | ホーム</title>
  <link rel="stylesheet" href="css/style.css">
</head>

<body>
  <header class="app-header">
    <div class="header-left">
      <a href="index.php" class="header-title">教室予約システム</a>
    </div>

    <div class="header-center">
      <button class="date-btn prev" aria-label="前日">◀</button>

      <div class="date-display">
        <button type="button" class="date-trigger" id="dateTrigger" aria-label="日付を選択">
          <div class="date-year" id="yearText">2025</div>
          <div class="date-md" id="mdText">12/23</div>
          <div class="date-week" id="weekText">曜日：(火)</div>
        </button>

        <input type="date" id="datePicker" class="date-picker" aria-label="日付を選択">
      </div>

      <button class="date-btn next" aria-label="翌日">▶</button>
    </div>

    <div class="header-right">
      <button class="menu-btn" type="button" aria-label="メニュー">☰</button>
    </div>
  </header>

  <main class="page">
    <h1 class="title">本日の予約（ドラッグで仮予約）</h1>

    <div class="schedule">
      <!-- 上：時間ヘッダー -->
      <div class="time-header">
        <div class="corner"></div>
        <div class="timeline" id="timelineHeader"></div>
      </div>

      <!-- 下：教室一覧（DBの classroom を元に生成） -->
      <div class="rows">
        <?php foreach ($rooms as $room): ?>
          <div class="row">
            <!-- 画面に見せるのは教室名だけ -->
            <div class="room">
              <?php echo htmlspecialchars($room["classroom_name"], ENT_QUOTES, "UTF-8"); ?>
            </div>

            <!-- 内部で使う：IDと名前を data-* に入れる（画面には出ない） -->
            <div class="lane"
              data-room-id="<?php echo htmlspecialchars($room["classroom_id"], ENT_QUOTES, "UTF-8"); ?>"
              data-room-name="<?php echo htmlspecialchars($room["classroom_name"], ENT_QUOTES, "UTF-8"); ?>">
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>

    <div id="dragInfo" class="drag-info"></div>

    <!-- クリアボタン（必要なら） -->
    <div class="actions">
      <button id="clearSelectionBtn" class="clear-btn" type="button">選択をクリア</button>
    </div>
  </main>

  <footer class="app-footer">
    2025補習© 教室予約システム
  </footer>

  <script src="js/script.js"></script>
</body>
</html>
