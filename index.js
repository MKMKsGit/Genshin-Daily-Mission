const URL = process.env.URL;

const doGet = () => {
  let html = HtmlService.createTemplateFromFile("WebSearch").evaluate();
  html.setTitle("Genshin | Daily Quest");
  return html;
};

function searchSimilarWords(keyword, wordList) {
  const regex = new RegExp(keyword, "gi");
  // สร้าง Regular Expression สำหรับค้นหา keyword ที่ไม่ตรงกันทั้งหมดใน String
  return wordList.reduce((result, word, index) => {
    if (word.match(regex) && !word.includes(keyword)) {
      result.push(index);
    }
    return result;
  }, []);
  // กรองสมาชิกที่ตรงกับ Regular Expression และไม่มี keyword ในประโยค
}

const QuestType = [
  "เควสทั่วไป",
  "เมือง Monsdtadt",
  "เมือง Liyue",
  "เมือง Inazuma",
  "เมือง Sumeru",
];

const QUEST_EN_COLUMN = 0;
const QUEST_TH_COLUMN = 1;
const MULTIPLAYER = 2;
const ACHIVEMENT = 3;
const STATUS = 4;
const CHECKED_BY = 5;
const INFO = 6;

const HEADER_ROW = 0;

const getDataByRows = (sheet, rows) => {
  const data = sheet.getDataRange().getValues();
  return data[rows];
};

const getDataByColumns = (sheet, columns) => {
  const data = sheet.getDataRange().getValues();
  let result = [];
  for (let i = 2; i < data.length; i++) {
    result.push(data[i][columns]);
  }
  return { header: data[HEADER_ROW][columns], data: result };
};

const search = (sheet, column, word) => {
  const currentData = getDataByColumns(sheet, column);
  if (!currentData) return [];
  let result = [];
  currentData.data.map((current, index) => {
    if (current.includes(word)) {
      result.push(index);
    }
  });
  if (result.length === 0) return null;
  return result;
};

const multiplayerTranslation = (value) => {
  if (value === 1) return "ทำไม่ได้นะ";
  if (value === 2)
    return "บางทีก็ทำได้ บางทีก็ทำไม่ได้ ลองอ่านหมายเหตุดูนะ(ถ้ามี)";
  return "ทำได้ เย้ๆๆ (หรือไม่ก็ยังไม่ตรวจ อิอิ)";
};

const multiplayerStatusTranslation = (value) => {
  if (value === 0) return true;
  return false;
};

const booleanTranslation = (value) => {
  if (value) return "ได้จ้า";
  return "ไม่ได้จ้า";
};

const test = () => {
  searchQuest("TH", "ไก่");
};

const searchQuest = (language, word) => {
  const ss = SpreadsheetApp.openByUrl(URL);

  const basic = ss.getSheetByName("Basic Quest");
  const mondstadt = ss.getSheetByName("Mondstadt");
  const liyue = ss.getSheetByName("Liyue");
  const inazuma = ss.getSheetByName("Inazuma");
  const sumeru = ss.getSheetByName("Sumeru");

  const allSheet = [basic, mondstadt, liyue, inazuma, sumeru];

  const SEARCH_COLUMN = language === "EN" ? QUEST_EN_COLUMN : QUEST_TH_COLUMN;
  let result = [];
  for (let i = 0; i < allSheet.length; i++) {
    const data = search(allSheet[i], SEARCH_COLUMN, word);
    if (data) {
      result.push({ dataIndex: data, sheet: i });
    }
  }

  let resultHtml = "";

  console.log(result.length !== 0, language);
  if (result.length !== 0) {
    resultHtml += '<p style="text-align: center;">ค้นหาเสร็จเรียบร้อย </p>';
    resultHtml += '<div class="datatable">';
    if (result.length === 1) {
      const firstResult = result[0];
      if (firstResult.dataIndex.length === 1) {
        const data = getDataByRows(
          allSheet[firstResult.sheet],
          firstResult.dataIndex[0] + 2
        );
        if (language === "EN") {
          resultHtml +=
            '<span class="dataheader">ชื่อเควส: </span><span>' +
            data[QUEST_EN_COLUMN] +
            "</span>";
        } else {
          resultHtml +=
            '<span class="dataheader">ชื่อเควส: </span><span>' +
            data[QUEST_TH_COLUMN] +
            "</span>";
        }
        const multiplayer = data[MULTIPLAYER]
          ? "ทำไม่ได้จ้า"
          : "ทำได้ เย้ๆๆ (หรือไม่ก็ยังไม่ตรวจ อิอิ)";
        resultHtml +=
          '<span class="dataheader">ทำใน co-op ได้ไหม: </span><span>' +
          multiplayer +
          "</span>";
        resultHtml +=
          '<span class="dataheader">ได้รับ Achievement ไหม: </span><span>' +
          booleanTranslation(data[ACHIVEMENT]) +
          "</span>";
        resultHtml +=
          '<span class="dataheader">สถานะการตรวจสอบ: </span><span>' +
          data[STATUS] +
          "</span>";
        resultHtml +=
          '<span class="dataheader">ผู้ตรวจสอบ: </span><span>' +
          data[CHECKED_BY] +
          "</span>";
        resultHtml +=
          '<span class="dataheader">หมายเหตุ: </span><span>' +
          data[INFO] +
          "</span>";
      } else {
        const name_TH = [];
        const name_EN = [];
        let multiplayer = 0;
        let achivement = false;
        let status = "ยังไม่ได้ตรวจสอบ";
        const checker = [];
        const info = [];
        console.log(result);
        for (let i = 0; i < firstResult.dataIndex.length; i++) {
          const currentData = getDataByRows(
            allSheet[firstResult.sheet],
            firstResult.dataIndex[i] + 2
          );
          if (multiplayer === 0 && currentData[MULTIPLAYER] === true) {
            multiplayer = 1;
          } else if (multiplayer === 1 && currentData[MULTIPLAYER] === false) {
            multiplayer = 2;
          }
          if (achivement === false && currentData[ACHIVEMENT] === true) {
            achivement = true;
          }
          if (
            (status === "ยังไม่ได้ตรวจสอบ" &&
              currentData[STATUS] === "ตรวจสอบแล้ว") ||
            currentData[STATUS] === "ยังไม่ตรวจ Achievement"
          ) {
            status = currentData[STATUS];
          } else if (
            (status === "ตรวจสอบแล้ว" &&
              currentData[STATUS] === "ยังไม่ได้ตรวจสอบ") ||
            (status === "ยังไม่ตรวจ Achievement" &&
              currentData[STATUS] === "ยังไม่ได้ตรวจสอบ")
          ) {
            status = "มีบางส่วนยังไม่ได้ตรวจสอบ";
          }
          if (!checker.includes(currentData[CHECKED_BY])) {
            checker.push(currentData[CHECKED_BY]);
          }
          if (!info.includes(currentData[INFO]) && currentData[INFO] !== "") {
            info.push(currentData[INFO]);
          }
          if (
            !name_TH.includes(currentData[QUEST_TH_COLUMN]) &&
            currentData[QUEST_TH_COLUMN] !== ""
          ) {
            name_TH.push(currentData[QUEST_TH_COLUMN]);
          }
          if (
            !name_EN.includes(currentData[QUEST_EN_COLUMN]) &&
            currentData[QUEST_EN_COLUMN] !== ""
          ) {
            name_EN.push(currentData[QUEST_EN_COLUMN]);
          }
        }

        if (language === "EN") {
          resultHtml +=
            '<span class="dataheader">ชื่อเควส: </span><span>' +
            name_EN.join(" / ") +
            "</span>";
        } else {
          resultHtml +=
            '<span class="dataheader">ชื่อเควส: </span><span>' +
            name_TH.join(" / ") +
            "</span>";
        }

        resultHtml +=
          '<span class="dataheader">ทำใน co-op ได้ไหม: </span><span>' +
          multiplayerTranslation(multiplayer) +
          "</span>";
        resultHtml +=
          '<span class="dataheader">ได้รับ Achievement ไหม: </span><span>' +
          booleanTranslation(achivement) +
          "</span>";
        resultHtml +=
          '<span class="dataheader">สถานะการตรวจสอบ: </span><span>' +
          status +
          "</span>";
        resultHtml +=
          '<span class="dataheader">ผู้ตรวจสอบ: </span><span>' +
          checker.join(", ") +
          "</span>";
        resultHtml +=
          '<span class="dataheader">หมายเหตุ: </span><span>' +
          info.join(" / ") +
          "</span>";
      }
    } else {
      for (let j = 0; j < result.length; j++) {
        const firstResult = result[j];
        resultHtml +=
          "<br><p>เควสจากหมวดหมู่ " + QuestType[firstResult.sheet] + "</p>";
        if (firstResult.dataIndex.length === 1) {
          const data = getDataByRows(
            allSheet[firstResult.sheet],
            firstResult.dataIndex[0] + 2
          );
          if (language === "EN") {
            resultHtml +=
              '<span class="dataheader">ชื่อเควส: </span><span>' +
              data[QUEST_EN_COLUMN] +
              "</span>";
          } else {
            resultHtml +=
              '<span class="dataheader">ชื่อเควส: </span><span>' +
              data[QUEST_TH_COLUMN] +
              "</span>";
          }
          const multiplayer = data[MULTIPLAYER] ? "ทำไม่ได้จ้า" : "ทำได้ เย้ๆๆ";
          resultHtml +=
            '<span class="dataheader">ทำใน co-op ได้ไหม: </span><span>' +
            multiplayer +
            "</span>";
          resultHtml +=
            '<span class="dataheader">ได้รับ Achievement ไหม: </span><span>' +
            booleanTranslation(data[ACHIVEMENT]) +
            "</span>";
          resultHtml +=
            '<span class="dataheader">สถานะการตรวจสอบ: </span><span>' +
            data[STATUS] +
            "</span>";
          resultHtml +=
            '<span class="dataheader">ผู้ตรวจสอบ: </span><span>' +
            data[CHECKED_BY] +
            "</span>";
          resultHtml +=
            '<span class="dataheader">หมายเหตุ: </span><span>' +
            data[INFO] +
            "</span>";
        } else {
          const name_TH = [];
          const name_EN = [];
          let multiplayer = 0;
          let achivement = false;
          let status = "ยังไม่ได้ตรวจสอบ";
          const checker = [];
          const info = [];
          console.log(result);
          for (let i = 0; i < firstResult.dataIndex.length; i++) {
            const currentData = getDataByRows(
              allSheet[firstResult.sheet],
              firstResult.dataIndex[i] + 2
            );
            if (multiplayer === 0 && currentData[MULTIPLAYER] === true) {
              multiplayer = 1;
            } else if (
              multiplayer === 1 &&
              currentData[MULTIPLAYER] === false
            ) {
              multiplayer = 2;
            }
            if (achivement === false && currentData[ACHIVEMENT] === true) {
              achivement = true;
            }
            if (
              (status === "ยังไม่ได้ตรวจสอบ" &&
                currentData[STATUS] === "ตรวจสอบแล้ว") ||
              currentData[STATUS] === "ยังไม่ตรวจ Achievement"
            ) {
              status = currentData[STATUS];
            } else if (
              (status === "ตรวจสอบแล้ว" &&
                currentData[STATUS] === "ยังไม่ได้ตรวจสอบ") ||
              (status === "ยังไม่ตรวจ Achievement" &&
                currentData[STATUS] === "ยังไม่ได้ตรวจสอบ")
            ) {
              status = "มีบางส่วนยังไม่ได้ตรวจสอบ";
            }
            if (
              !checker.includes(currentData[CHECKED_BY]) &&
              currentData[CHECKED_BY] !== ""
            ) {
              checker.push(currentData[CHECKED_BY]);
            }
            if (!info.includes(currentData[INFO])) {
              info.push(currentData[INFO]);
            }
            if (
              !name_TH.includes(currentData[QUEST_TH_COLUMN]) &&
              currentData[QUEST_TH_COLUMN] !== ""
            ) {
              name_TH.push(currentData[QUEST_TH_COLUMN]);
            }
            if (
              !name_EN.includes(currentData[QUEST_EN_COLUMN]) &&
              currentData[QUEST_EN_COLUMN] !== ""
            ) {
              name_EN.push(currentData[QUEST_EN_COLUMN]);
            }
          }

          if (language === "EN") {
            resultHtml +=
              '<span class="dataheader">ชื่อเควส: </span><span>' +
              name_EN.join(" / ") +
              "</span>";
          } else {
            resultHtml +=
              '<span class="dataheader">ชื่อเควส: </span><span>' +
              name_TH.join(" / ") +
              "</span>";
          }

          resultHtml +=
            '<span class="dataheader">ทำใน co-op ได้ไหม: </span><span>' +
            multiplayerTranslation(multiplayer) +
            "</span>";
          resultHtml +=
            '<span class="dataheader">ได้รับ Achievement ไหม: </span><span>' +
            booleanTranslation(achivement) +
            "</span>";
          resultHtml +=
            '<span class="dataheader">สถานะการตรวจสอบ: </span><span>' +
            status +
            "</span>";
          resultHtml +=
            '<span class="dataheader">ผู้ตรวจสอบ: </span><span>' +
            checker.join(", ") +
            "</span>";
          resultHtml +=
            '<span class="dataheader">หมายเหตุ: </span><span>' +
            info.join(" / ") +
            "</span>";
        }
      }
    }
    resultHtml += "</div>";
  } else {
    if (language === "EN") {
      resultHtml = "No quests found, please check your spell.";
    } else {
      resultHtml =
        'ไม่พบข้อมูลเควสดังกล่าว โปรดตรวจสอบการสะกดอีกครั้ง (ในกรณีที่มีเครื่องหมายพิเศษ เช่น !," โปรดใส่ให้ครบด้วย)';
    }
  }
  return resultHtml;
};
