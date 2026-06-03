import type { QuotePool, QuoteTemplate } from "./types";

function q(pool: QuotePool, text: string): QuoteTemplate {
  return { pool, text };
}

const WINNER: QuoteTemplate[] = [
  q("winner", "{playerName} 今日打到對面懷疑自己買咗假貨。"),
  q("winner", "{playerName} 啲陀螺今日食咗偉哥。"),
  q("winner", "{playerName} 今日勁到連裁判都想投降。"),
  q("winner", "{playerName} 今日個陀螺識自己返工。"),
  q("winner", "{playerName} 呢場打到對面想即場放盤。"),
  q("winner", "{playerName} 今日根本開咗作弊器。"),
  q("winner", "{playerName} 個發射器應該插咗220V。"),
  q("winner", "{playerName} 今日勁過說明書。"),
  q("winner", "{playerName} 啲分多到要交稅。"),
  q("winner", "{playerName} 今日贏到阿媽都認唔到。"),
  q("winner", "{playerName} 今日狀態好到要申請專利。"),
  q("winner", "{playerName} 對手今日只係嚟做背景。"),
  q("winner", "{playerName} 個陀螺今日識講「仲未係時候」。"),
  q("winner", "{playerName} 今日贏到連計分板都驚。"),
  q("winner", "{playerName} 發射一記，全場靜音。"),
];

const UPSET: QuoteTemplate[] = [
  q("upset", "冇人估到 {playerName} 今日會醒。"),
  q("upset", "{playerName} 終於唔係送分童子。"),
  q("upset", "今日太陽由西邊出？"),
  q("upset", "{playerName} 今日食錯藥反而有效。"),
  q("upset", "恭喜 {playerName} 成功脫離魚腩部隊。"),
  q("upset", "大家以為係 BYE，原來真係參賽者。"),
  q("upset", "{playerName} 今日突然有腦。"),
  q("upset", "系統偵測到奇蹟發生。"),
  q("upset", "今日值得買六合彩。"),
  q("upset", "恭喜解鎖「原來識玩」成就。"),
  q("upset", "{playerName} 逆襲劇本已上映。"),
  q("upset", "賠率表今日集體陣亡。"),
];

const LOSER: QuoteTemplate[] = [
  q("loser", "{playerName} 今日嚟交朋友唔係嚟比賽。"),
  q("loser", "{playerName} 今日負責派分。"),
  q("loser", "{playerName} 個陀螺比佢更想返屋企。"),
  q("loser", "{playerName} 今日全勤送頭。"),
  q("loser", "恭喜 {playerName} 榮獲最佳陪跑員。"),
  q("loser", "{playerName} 今日打得好有參與感。"),
  q("loser", "{playerName} 今日輸到 GPS 都搵唔到方向。"),
  q("loser", "{playerName} 個分數仲少過停車費。"),
  q("loser", "{playerName} 今日主打一個陪伴。"),
  q("loser", "{playerName} 個戰術叫做「輸少當贏」。"),
  q("loser", "{playerName} 今日係全場最佳觀眾。"),
  q("loser", "{playerName} 輸得咁有禮貌，值得鼓掌。"),
];

const LAST: QuoteTemplate[] = [
  q("last", "恭喜 {playerName} 穩坐榜尾寶座。"),
  q("last", "{playerName} 今日成功保住最後一名。"),
  q("last", "{playerName} 連包尾都包得咁穩。"),
  q("last", "今日冇冠軍，只有 {playerName}。"),
  q("last", "{playerName} 用生命守護榜尾。"),
  q("last", "包尾包到有職業道德。"),
  q("last", "{playerName} 今日成功避開所有勝利。"),
  q("last", "排名再跌就要落地下室。"),
  q("last", "恭喜獲得安慰獎：空氣。"),
  q("last", "{playerName} 今日戰績有啲抽象。"),
  q("last", "{playerName} 榜尾位置已焊死。"),
];

const XTREME: QuoteTemplate[] = [
  q("xtreme", "個陀螺飛到想移民。"),
  q("xtreme", "啱啱嗰下飛到差啲入隔離枱。"),
  q("xtreme", "呢個唔係 Xtreme Finish，係航空展。"),
  q("xtreme", "FAA 已收到飛行申請。"),
  q("xtreme", "個陀螺以為自己係無人機。"),
  q("xtreme", "差啲飛到停車場。"),
  q("xtreme", "飛得咁遠應該收行李費。"),
  q("xtreme", "NASA 表示有興趣研究。"),
  q("xtreme", "陀螺：我自由啦！"),
  q("xtreme", "今日最佳飛行距離紀錄誕生。"),
  q("xtreme", "{playerName} 一擊之後全場抬頭望天。"),
  q("xtreme", "爆旋現場已升級做彈道測驗。"),
];

const PERFECT: QuoteTemplate[] = [
  q("perfect", "{playerName} 今日全勝，建議尿檢。"),
  q("perfect", "全勝？查下部發射器先。"),
  q("perfect", "{playerName} 今日真係食人唔吐骨。"),
  q("perfect", "對手集體申請工傷。"),
  q("perfect", "今日全場都係受害者。"),
  q("perfect", "{playerName} 已被列入危險人物名單。"),
  q("perfect", "今日根本係虐待動物。"),
  q("perfect", "對手表示不服，但無用。"),
  q("perfect", "全勝打卡成功。"),
  q("perfect", "冠軍獎盃已自動認主。"),
  q("perfect", "{playerName} 今日冇留任何懸念。"),
];

const RANDOM: QuoteTemplate[] = [
  q("random", "今日最好狀態嘅其實係冷氣機。"),
  q("random", "個場最忙係計分員。"),
  q("random", "今日最大贏家係電費公司。"),
  q("random", "有人贏比賽，有人贏人生。"),
  q("random", "今日場地承受咗太多。"),
  q("random", "陀螺比人更有鬥志。"),
  q("random", "有啲人成日贏，有啲人成日嚟。"),
  q("random", "今日大家都盡力演出。"),
  q("random", "友誼第一，輸贏第三。"),
  q("random", "最重要係有影相。"),
  q("random", "比賽結束，吹水開始。"),
  q("random", "今日戰報已送交群組審批。"),
];

const EOS: QuoteTemplate[] = [
  q("eos", "今日 EOS 杯又有人封神。"),
  q("eos", "EOS 杯見證奇蹟。"),
  q("eos", "EOS 杯見證事故。"),
  q("eos", "EOS 杯從來唔缺笑料。"),
  q("eos", "今日又有人想即場買新陀螺。"),
  q("eos", "EOS 杯：友情粉碎機。"),
  q("eos", "今日輸咗唔緊要，下次再輸。"),
  q("eos", "EOS 杯從來唔缺受害者。"),
  q("eos", "今日冠軍已獲得吹水權一星期。"),
  q("eos", "今日包尾要負責執枱。"),
  q("eos", "EOS 現場：贏咗要請飲，輸咗要靜音。"),
];

const TOXIC: QuoteTemplate[] = [
  q("toxic", "{playerName} 今日個發射仲慢過 Windows Update。"),
  q("toxic", "個陀螺都想換主人。"),
  q("toxic", "發射器已盡力。"),
  q("toxic", "問題唔係陀螺。"),
  q("toxic", "問題亦唔係運氣。"),
  q("toxic", "主要問題坐喺發射器後面。"),
  q("toxic", "個陀螺值得更好。"),
  q("toxic", "今日表現令人鼻酸。"),
  q("toxic", "輸到連 AI 都唔識安慰。"),
  q("toxic", "建議重溫教學影片。"),
  q("toxic", "{playerName} 今日技術同運氣一齊請假。"),
];

const GOD: QuoteTemplate[] = [
  q("god", "今晚請尊稱 {playerName} 做陀神。"),
  q("god", "{playerName} 今日勁到可以收學費。"),
  q("god", "對手已變成背景板。"),
  q("god", "呢場比賽有冠軍，亦有觀眾。"),
  q("god", "有啲人係玩家，有啲人係經驗包。"),
  q("god", "今日 MVP：{playerName}，無爭議。"),
  q("god", "其他人努力咗，但唔夠。"),
  q("god", "今日個排行榜有啲殘忍。"),
  q("god", "系統建議其他玩家重新做人。"),
  q("god", "{playerName} 今日勁到連自己都唔信。"),
  q("god", "{playerName} 已進入宗師模式。"),
];

export const ALL_QUOTES: QuoteTemplate[] = [
  ...WINNER,
  ...UPSET,
  ...LOSER,
  ...LAST,
  ...XTREME,
  ...PERFECT,
  ...RANDOM,
  ...EOS,
  ...TOXIC,
  ...GOD,
];

export const QUOTES_BY_POOL: Record<QuotePool, QuoteTemplate[]> = {
  winner: WINNER,
  upset: UPSET,
  loser: LOSER,
  last: LAST,
  xtreme: XTREME,
  perfect: PERFECT,
  random: RANDOM,
  eos: EOS,
  toxic: TOXIC,
  god: GOD,
};
