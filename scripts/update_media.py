"""예그린교회 유튜브에서 말씀 영상을 종류별로 모아 media.js에 적는다.

홈페이지를 파일로 열어도 보이도록 JSON 대신 window.MEDIA = {...} 형태로 저장한다.

채널 피드는 최근 15개만 주므로, 새 영상을 기존 목록 앞에 쌓아 종류마다 최대 KEEP개를 남긴다.
피드에 해당 종류가 없으면 그 목록은 그대로 둔다.

제목 예: 2026.11.01 "말씀을 대하는 결심" (스7:1-10) 고용진 목사 예그린교회 주일2부예배
        2026.11.06 새벽예배(요엘 2장-2) 고용진 목사 예그린교회
        예그린 성경통독 311일차 (26.11.07) 요한복음 10-11장
        예그린 성경공부 37주 [데살로니가전후서, 목회서신] 2026.11.04
"""
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

CHANNEL_ID = "UCcIk9qVxhHSqUNX4VDgwkHQ"  # @yegrin
FEED = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
OUT = Path(__file__).resolve().parent.parent / "media.js"
PREFIX = "window.MEDIA = "
KEEP = 20

# 종류: 제목에 들어 있으면 그 종류로 본다 (공백 무시, 위에서부터 먼저 맞는 것)
KINDS = [
    ("sunday", "주일2부예배"),
    ("dawn", "새벽예배"),
    ("reading", "성경통독"),
    ("study", "성경공부"),
]

NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}

BOOKS = {
    "창": "창세기", "출": "출애굽기", "레": "레위기", "민": "민수기", "신": "신명기",
    "수": "여호수아", "삿": "사사기", "룻": "룻기", "삼상": "사무엘상", "삼하": "사무엘하",
    "왕상": "열왕기상", "왕하": "열왕기하", "대상": "역대상", "대하": "역대하", "스": "에스라",
    "느": "느헤미야", "에": "에스더", "욥": "욥기", "시": "시편", "잠": "잠언",
    "전": "전도서", "아": "아가", "사": "이사야", "렘": "예레미야", "애": "예레미야애가",
    "겔": "에스겔", "단": "다니엘", "호": "호세아", "욜": "요엘", "암": "아모스",
    "옵": "오바댜", "욘": "요나", "미": "미가", "나": "나훔", "합": "하박국",
    "습": "스바냐", "학": "학개", "슥": "스가랴", "말": "말라기",
    "마": "마태복음", "막": "마가복음", "눅": "누가복음", "요": "요한복음", "행": "사도행전",
    "롬": "로마서", "고전": "고린도전서", "고후": "고린도후서", "갈": "갈라디아서", "엡": "에베소서",
    "빌": "빌립보서", "골": "골로새서", "살전": "데살로니가전서", "살후": "데살로니가후서",
    "딤전": "디모데전서", "딤후": "디모데후서", "딛": "디도서", "몬": "빌레몬서", "히": "히브리서",
    "약": "야고보서", "벧전": "베드로전서", "벧후": "베드로후서", "요일": "요한일서",
    "요이": "요한이서", "요삼": "요한삼서", "유": "유다서", "계": "요한계시록",
}


def full_passage(short):
    """스7:1-10 → 에스라 7:1-10"""
    m = re.match(r"([가-힣]+)\s*(\d.*)", short)
    if not m or m.group(1) not in BOOKS:
        return short
    return f"{BOOKS[m.group(1)]} {m.group(2)}"


def find_date(title, published):
    m = re.search(r"(20\d{2})\.(\d{1,2})\.(\d{1,2})", title)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    m = re.search(r"\((\d{2})\.(\d{1,2})\.(\d{1,2})\)", title)  # (26.11.07)
    if m:
        return f"20{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    return published[:10]


def parse(kind, title, video_id, published):
    item = {"videoId": video_id, "date": find_date(title, published), "youtubeTitle": title}
    preacher = re.search(r"([가-힣]{2,4}\s*(?:목사|전도사|선교사))", title)
    item["preacher"] = preacher.group(1) if preacher else ""

    if kind == "sunday":
        name = re.search(r"[\"“]([^\"”]+)[\"”]", title)
        passage = re.search(r"\(([^)]*\d[^)]*)\)", title)
        series = re.search(r"\[([^\]]+)\]", title)
        item["title"] = name.group(1).strip() if name else title
        item["passage"] = full_passage(passage.group(1).strip()) if passage else ""
        item["series"] = series.group(1) if series else ""
    elif kind == "dawn":
        passage = re.search(r"새벽예배\s*\(([^)]+)\)", title)
        item["title"] = f"새벽예배 · {passage.group(1)}" if passage else "새벽예배"
        item["passage"] = passage.group(1) if passage else ""
    elif kind == "reading":
        day = re.search(r"(\d+)일차", title)
        rng = re.search(r"\)\s*(.+)$", title)
        item["title"] = f"성경통독 {day.group(1)}일차" if day else "성경통독"
        item["passage"] = rng.group(1).strip() if rng else ""
    elif kind == "study":
        week = re.search(r"(\d+)주", title)
        topic = re.search(r"\[([^\]]+)\]", title)
        item["title"] = f"성경공부 {week.group(1)}주" if week else "성경공부"
        item["passage"] = topic.group(1) if topic else ""
    return item


def kind_of(title):
    t = title.replace(" ", "")
    for kind, word in KINDS:
        if word in t:
            return kind
    return None


def main():
    with urllib.request.urlopen(FEED, timeout=30) as res:
        root = ET.fromstring(res.read())

    data = json.loads(OUT.read_text(encoding="utf-8")[len(PREFIX):].rstrip().rstrip(";")) if OUT.exists() else {}
    lists = data.get("lists", {})
    changed = False

    # 피드는 최신순 → 오래된 것부터 앞에 끼워 넣어야 최신이 맨 앞에 옴
    for entry in reversed(root.findall("a:entry", NS)):
        title = entry.findtext("a:title", "", NS)
        kind = kind_of(title)
        if not kind:
            continue
        vid = entry.findtext("yt:videoId", "", NS)
        items = lists.setdefault(kind, [])
        if any(i["videoId"] == vid for i in items):
            continue
        items.insert(0, parse(kind, title, vid, entry.findtext("a:published", "", NS)))
        changed = True

    for kind in lists:
        lists[kind].sort(key=lambda i: i["date"], reverse=True)
        del lists[kind][KEEP:]

    if not changed:
        print("새 영상이 없어 media.js를 그대로 둡니다.")
        return 0
    OUT.write_text(PREFIX + json.dumps({"lists": lists}, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print("media.js 갱신:", {k: len(v) for k, v in lists.items()})
    return 0


if __name__ == "__main__":
    sys.exit(main())
