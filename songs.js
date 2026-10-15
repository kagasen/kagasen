/* 学習ソング（かがせんの YouTube の 曲）。ポータルでは アプリと 同じ 一覧に まぜて 出す。
   ・カードを おすと YouTube を 新しい タブで ひらく だけ（ページに 埋めこまない）。
   ・曲を ふやす ときは この 配列に 1つ 足すだけ。形は apps.js と 同じ（category は "song"）。
   ・link は 共有ボタンの ?si=… を 消して 動画IDだけに する（追跡用の 文字なので）。
   ・image は images/songs/ に 800x450 WebP で 同梱（外から 読みこまない＝オフライン方針）。
   ・date は ポータルに のせた 日（新着順・NEW バッジに つかう）。
   ・apps.js とは 別ファイル（release-check / build-seo が apps.js を アプリ一覧として 読むため）。 */
const songsData = [
    {
        id: "song-kuku-kuru",
        title: "九九くる",
        description: "かけ算の 九九を リズムに のせて おぼえよう。数字が くるくる まわる 学習ソング。",
        category: "song",
        tagName: "学習ソング",
        date: "2026/10/14",
        colorClass: "subject-orange",
        image: "images/songs/kuku-kuru-v2.webp",
        link: "https://youtu.be/EgWja7KAGRI"
    },
    {
        id: "song-genso",
        title: "元素の歌",
        description: "元素の 名前や 記号に、歌で たのしく ふれてみよう。理科の 学習ソング。",
        category: "song",
        tagName: "学習ソング",
        date: "2026/10/14",
        colorClass: "subject-orange",
        image: "images/songs/genso-v2.webp",
        link: "https://youtu.be/RhWFiavJh_8"
    },
    {
        id: "song-rekishi-jinbutsu",
        title: "歴史人物の歌",
        description: "歴史に 登場する 人物を、歌に あわせて おぼえよう。社会の 学習ソング。",
        category: "song",
        tagName: "学習ソング",
        date: "2026/10/14",
        colorClass: "subject-orange",
        image: "images/songs/rekishi-jinbutsu-v2.webp",
        link: "https://youtu.be/JJrOFTdchyk"
    },
    {
        id: "song-zukei-koushiki",
        title: "図形の公式の歌",
        description: "図形の 面積などの 公式を、リズムに のせて おぼえよう。算数の 学習ソング。",
        category: "song",
        tagName: "学習ソング",
        date: "2026/10/14",
        colorClass: "subject-orange",
        image: "images/songs/zukei-koushiki-v2.webp",
        link: "https://youtu.be/LaDycwkqsv4"
    },
    {
        id: "song-kumowahajiki",
        title: "くもわはじきの歌",
        description: "算数の くもわ・はじきを、歌と いっしょに おぼえよう。計算の こつに ふれる 学習ソング。",
        category: "song",
        tagName: "学習ソング",
        date: "2026/10/14",
        colorClass: "subject-orange",
        image: "images/songs/kumowahajiki-v2.webp",
        link: "https://youtu.be/wVluS0ZZIpc"
    },
    {
        id: "song-tontontoton-todofuken",
        title: "トントントトン！都道府県",
        description: "47都道府県の歌。5回 くりかえすうちに 地図の 文字が だんだん 消える 20分チャレンジ（LEVEL1〜FINAL）。",
        category: "song",
        tagName: "学習ソング",
        date: "2026/10/04",
        colorClass: "subject-orange",
        image: "images/songs/tontontoton-todofuken.webp",
        link: "https://youtu.be/927CQTsGzgk"
    },
    {
        id: "song-kenchou-shozaichi",
        title: "県庁所在地の歌",
        description: "県名と ちがう 18都道県の 県庁所在地を、5回の くりかえしで おぼえよう！社会の 覚え歌。",
        category: "song",
        tagName: "学習ソング",
        date: "2026/10/04",
        colorClass: "subject-orange",
        image: "images/songs/kenchou-shozaichi.webp",
        link: "https://youtu.be/prNwWu5CugQ"
    }
];
