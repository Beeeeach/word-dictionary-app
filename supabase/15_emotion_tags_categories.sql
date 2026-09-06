-- ============================================================
-- 言葉の辞書アプリ - 投稿タグのカテゴリ化 + タグ全面刷新
-- 実行前提: 既存の投稿は全てテストデータのため、既存タグ・紐付けは
-- 削除して問題ない（プロダクトオーナー確認済み）。
-- 対象: post_emotion_tags（投稿者が付けるタグ）のみ。
-- reaction_tags（閲覧者の絵文字リアクション）は emotion_tags を
-- 参照し続けるが、今回のカテゴリタグとは別運用のまま変更しない。
--
-- 重要な注意点:
-- カテゴリタグは「幸せ」「孤独」「切ない」「穏やか」「かわいい」等、
-- 同じ単語が複数カテゴリにまたがって登場する（例: 幸せ→テーマ/感情）。
-- 既存の emotion_tags.name に unique制約がある前提だと、これらは
-- 1件しか登録できず意図した7カテゴリ構成にならない。
-- そのため、name の一意制約は (category, name) の複合一意制約に
-- 差し替える。既存の反応タグ(category is null)には影響しない。
--
-- name_en列: 英語学習者モードでタグ選択オーバーレイ・投稿カードの
-- タグ表示を英語化するための英訳。lib/data/emotion-tags.ts 側で
-- learner_mode時に name の代わりに参照する。
-- ============================================================

-- 1. category列・英語名列を追加（既存の絵文字リアクション用タグは両方null）
alter table public.emotion_tags
  add column if not exists category text;

alter table public.emotion_tags
  add column if not exists name_en text;

-- 2. 既存の投稿者向けタグ・紐付けをクリア
--    （reaction_tagsが参照している行は削除しない: category is null の行はそのまま）
delete from public.post_emotion_tags;

delete from public.emotion_tags
where category is not null
   or name in ('じわる','かわいい','かっこいい','謎','推せる','闇を感じる','使いたい','方言っぽい','古い','新しい');

-- 3. name単独のunique制約を外し、(category, name)の複合unique制約に変更する。
--    制約名は環境によって異なる可能性があるため、information_schemaから動的に取得して削除する。
do $$
declare
  constraint_name text;
begin
  select tc.constraint_name into constraint_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
  where tc.table_schema = 'public'
    and tc.table_name = 'emotion_tags'
    and tc.constraint_type = 'UNIQUE'
    and kcu.column_name = 'name'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.emotion_tags drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.emotion_tags
  drop constraint if exists emotion_tags_category_name_key;

alter table public.emotion_tags
  add constraint emotion_tags_category_name_key unique (category, name);

-- 4. category に制約をつける（7カテゴリのみ許可、nullは既存の反応タグ用に許可）
alter table public.emotion_tags
  drop constraint if exists emotion_tags_category_check;

alter table public.emotion_tags
  add constraint emotion_tags_category_check
  check (category is null or category in ('theme','emotion','purpose','mood','format','target','scene'));

-- 5. 新タグ投入（name: 日本語, name_en: 英語学習者モード表示用の英訳）
--    name には "#" を含めず素の単語のみを格納し、表示側で "#" を付与する。
--    emoji列はこのカテゴリタグでは使わないため null。
insert into public.emotion_tags (name, name_en, category, sort_order) values
-- 1. テーマ theme
('人生','life','theme',1),('生き方','way of life','theme',2),('恋愛','love','theme',3),('片思い','one-sided love','theme',4),('失恋','heartbreak','theme',5),
('家族','family','theme',6),('親子','parent and child','theme',7),('夫婦','marriage','theme',8),('友情','friendship','theme',9),('友達','friends','theme',10),
('人間関係','relationships','theme',11),('仕事','work','theme',12),('働き方','way of working','theme',13),('勉強','study','theme',14),('学校','school','theme',15),
('青春','youth','theme',16),('日常','everyday life','theme',17),('夢','dreams','theme',18),('目標','goals','theme',19),('努力','effort','theme',20),
('挑戦','challenge','theme',21),('成長','growth','theme',22),('成功','success','theme',23),('失敗','failure','theme',24),('幸せ','happiness','theme',25),
('自分','myself','theme',26),('過去','the past','theme',27),('思い出','memories','theme',28),('未来','the future','theme',29),('別れ','farewell','theme',30),
('出会い','encounters','theme',31),('孤独','loneliness','theme',32),('季節','seasons','theme',33),('自然','nature','theme',34),('時間','time','theme',35),

-- 2. 感情 emotion
('嬉しい','happy','emotion',1),('楽しい','fun','emotion',2),('幸せ','happiness','emotion',3),('喜び','joy','emotion',4),('感謝','gratitude','emotion',5),
('愛','love','emotion',6),('好き','fondness','emotion',7),('大好き','love it','emotion',8),('愛しい','dear','emotion',9),('恋しい','longing','emotion',10),
('ときめき','excitement (heart)','emotion',11),('ワクワク','excited','emotion',12),('ドキドキ','nervous','emotion',13),('安心','relief','emotion',14),('穏やか','calm','emotion',15),
('癒される','healing','emotion',16),('感動','moved','emotion',17),('懐かしい','nostalgic','emotion',18),('寂しい','lonely','emotion',19),('悲しい','sad','emotion',20),
('切ない','bittersweet','emotion',21),('苦しい','painful','emotion',22),('辛い','tough','emotion',23),('不安','anxious','emotion',24),('怖い','scared','emotion',25),
('怒り','anger','emotion',26),('悔しい','frustrated','emotion',27),('嫉妬','jealousy','emotion',28),('後悔','regret','emotion',29),('孤独','loneliness','emotion',30),
('虚しい','empty','emotion',31),('疲れた','tired','emotion',32),('落ち込む','down','emotion',33),('憂鬱','melancholy','emotion',34),('希望','hope','emotion',35),

-- 3. 目的 purpose
('励まし','encouragement','purpose',1),('応援','support','purpose',2),('勇気','courage','purpose',3),('元気','energy','purpose',4),('癒し','healing','purpose',5),
('安心','reassurance','purpose',6),('共感','empathy','purpose',7),('気づき','realization','purpose',8),('学び','learning','purpose',9),('背中を押す','a nudge forward','purpose',10),
('前向きになれる','feel more positive','purpose',11),('自分を大切に','be kind to yourself','purpose',12),('頑張りすぎない','don''t overdo it','purpose',13),('休もう','take a rest','purpose',14),('心を整える','settle your mind','purpose',15),
('慰め','comfort','purpose',16),('寄り添い','being there for you','purpose',17),('感謝を伝えたい','want to say thanks','purpose',18),('愛を伝えたい','want to say I love you','purpose',19),('誰かに届けたい','want this to reach someone','purpose',20),
('笑ってほしい','hope you smile','purpose',21),('泣いてほしい','hope you cry','purpose',22),('考えてほしい','hope you think about it','purpose',23),('立ち止まる','pause for a moment','purpose',24),('一歩踏み出す','take a step forward','purpose',25),
('諦めない','don''t give up','purpose',26),('自分を信じる','believe in yourself','purpose',27),('幸せになってほしい','hope you find happiness','purpose',28),('忘れないために','so we don''t forget','purpose',29),('伝えたい','want to tell you','purpose',30),

-- 4. 雰囲気 mood
('優しい','gentle','mood',1),('温かい','warm','mood',2),('柔らかい','soft','mood',3),('穏やか','calm','mood',4),('静か','quiet','mood',5),
('明るい','bright','mood',6),('爽やか','refreshing','mood',7),('美しい','beautiful','mood',8),('綺麗','pretty','mood',9),('かわいい','cute','mood',10),
('かっこいい','cool','mood',11),('おしゃれ','stylish','mood',12),('シンプル','simple','mood',13),('エモい','emotional','mood',14),('切ない','bittersweet','mood',15),
('儚い','fleeting','mood',16),('寂しい','lonely','mood',17),('ノスタルジック','nostalgic','mood',18),('幻想的','fantastical','mood',19),('神秘的','mysterious','mood',20),
('夢のよう','dreamlike','mood',21),('ロマンチック','romantic','mood',22),('大人っぽい','mature','mood',23),('ダーク','dark','mood',24),('シュール','surreal','mood',25),
('コミカル','comical','mood',26),('ユーモア','humorous','mood',27),('深い','profound','mood',28),('静謐','serene','mood',29),('余韻','lingering feeling','mood',30),
('不思議','curious','mood',31),('独特','unique','mood',32),

-- 5. 形式 format
('一言','a word','format',1),('ひとこと','a short line','format',2),('短文','short text','format',3),('長文','long text','format',4),('詩','poem','format',5),
('ポエム','poetry','format',6),('名言','quote','format',7),('格言','maxim','format',8),('ことわざ','proverb','format',9),('短歌','tanka','format',10),
('俳句','haiku','format',11),('川柳','senryu','format',12),('散文','prose','format',13),('散文詩','prose poem','format',14),('物語','story','format',15),
('エッセイ','essay','format',16),('日記','diary','format',17),('手紙','letter','format',18),('独白','monologue','format',19),('セリフ','dialogue line','format',20),
('会話','conversation','format',21),('独り言','talking to myself','format',22),('つぶやき','a murmur','format',23),('創作','original work','format',24),('自作','self-written','format',25),
('即興','improvised','format',26),('言葉遊び','wordplay','format',27),('ダジャレ','pun','format',28),('フィクション','fiction','format',29),('ノンフィクション','non-fiction','format',30),

-- 6. 対象 target
('自分へ','to myself','target',1),('過去の自分へ','to my past self','target',2),('未来の自分へ','to my future self','target',3),('あなたへ','to you','target',4),('君へ','to you (casual)','target',5),
('あなたに届けたい','I want this to reach you','target',6),('好きな人へ','to someone I like','target',7),('恋人へ','to my partner','target',8),('元恋人へ','to my ex','target',9),('家族へ','to my family','target',10),
('親へ','to my parents','target',11),('子どもへ','to my child','target',12),('友達へ','to my friends','target',13),('親友へ','to my best friend','target',14),('大切な人へ','to someone dear to me','target',15),
('仲間へ','to my crew','target',16),('先輩へ','to my senior','target',17),('後輩へ','to my junior','target',18),('頑張っている人へ','to those trying hard','target',19),('疲れている人へ','to those who are tired','target',20),
('悩んでいる人へ','to those who are struggling','target',21),('迷っている人へ','to those who are unsure','target',22),('悲しんでいる人へ','to those who are sad','target',23),('失恋した人へ','to those who went through heartbreak','target',24),('恋をしている人へ','to those who are in love','target',25),
('夢を追う人へ','to those chasing a dream','target',26),('新しい一歩を踏み出す人へ','to those taking a new step','target',27),('すべての人へ','to everyone','target',28),('誰かへ','to someone','target',29),

-- 7. シーン scene
('朝','morning','scene',1),('昼','midday','scene',2),('夕方','evening','scene',3),('夜','night','scene',4),('深夜','late night','scene',5),
('寝る前','before bed','scene',6),('起きたとき','when you wake up','scene',7),('仕事前','before work','scene',8),('仕事終わり','after work','scene',9),('学校へ行く前','before school','scene',10),
('勉強中','while studying','scene',11),('休憩中','on a break','scene',12),('一人の時間','time alone','scene',13),('家に帰ったとき','when you get home','scene',14),('休日','a day off','scene',15),
('疲れたとき','when you''re tired','scene',16),('落ち込んだとき','when you''re feeling down','scene',17),('悩んだとき','when you''re troubled','scene',18),('迷ったとき','when you''re unsure','scene',19),('不安なとき','when you''re anxious','scene',20),
('泣きたいとき','when you want to cry','scene',21),('笑いたいとき','when you want to laugh','scene',22),('元気が欲しいとき','when you need energy','scene',23),('勇気が欲しいとき','when you need courage','scene',24),('癒されたいとき','when you need healing','scene',25),
('眠れないとき','when you can''t sleep','scene',26),('恋しているとき','when you''re in love','scene',27),('失恋したとき','after a breakup','scene',28),('頑張りたいとき','when you want to try hard','scene',29),('立ち止まりたいとき','when you want to pause','scene',30),
('新しい一歩','a new step','scene',31),('人生に迷ったとき','when you''re lost in life','scene',32),('何となく','just because','scene',33),('ふと思ったとき','a passing thought','scene',34)
on conflict (category, name) do update set name_en = excluded.name_en;
