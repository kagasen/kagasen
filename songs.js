/* 学習ソング（かがせんの YouTube の 曲）。ポータルでは アプリと 同じ 一覧に まぜて 出す。
   ・カードを おすと YouTube を 新しい タブで ひらく だけ（ページに 埋めこまない）。
   ・曲を ふやす ときは この 配列に 1つ 足すだけ。形は apps.js と 同じ（category は "song"）。
   ・link は 共有ボタンの ?si=… を 消して 動画IDだけに する（追跡用の 文字なので）。
   ・image は YouTube の サムネを 落として images/songs/ に WebP で 同梱（外から 読みこまない＝オフライン方針）。
       curl -o x.jpg https://i.ytimg.com/vi/<動画ID>/maxresdefault.jpg → 800x450 の WebP に
   ・date は ポータルに のせた 日（新着順・NEW バッジに つかう）。
   ・apps.js とは 別ファイル（release-check / build-seo が apps.js を アプリ一覧として 読むため）。 */
const songsData = [
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
