
-- 娉ㄦ剰锛氭祴璇曠敤鎴峰瘑鐮侀渶瑕佷娇鐢?bcrypt 鍝堝笇鍚庢彃鍏?
-- 绀轰緥鍝堝笇鍊硷紙瀵嗙爜: admin123锛夐渶瑕佸湪搴旂敤鍚姩鏃堕€氳繃鏈嶅姟鐢熸垚
-- INSERT INTO users (email, password_hash, username, role) 
-- VALUES ('admin@example.com', '$2b$10$...', 'admin', 'admin');

-- 鎻掑叆娴嬭瘯鏂囩珷
INSERT INTO articles (slug, title, description, content, category, cover_image) 
VALUES 
('hello-world', '娆㈣繋鏉ュ埌 A.T. Field', '杩欐槸鎴戠殑绗竴绡囦簩娆″厓鍗氭枃', '# 浣犲ソ锛屼笘鐣岋紒\n\n杩欐槸鎴戠殑**缁濆棰嗗煙**銆傚湪杩欓噷锛屾垜浼氬垎浜叧浜庡姩婕€佹父鎴忓拰鎶€鏈殑涓€鍒囥€俓n\n## 鍏充簬鏈珯\n\n鏈珯鍩轰簬 Cloudflare 鍏ㄥ妗舵瀯寤猴紝杩芥眰鏋佽嚧鐨勮瑙変綋楠屽拰娴佺晠鐨勪氦浜掋€?, '鍏憡', NULL),
('my-anime-journey', '鎴戠殑浜屾鍏冧箣鏃?, '璁板綍鎴戠殑杩界暘鍘嗙▼', '# 鎴戠殑浜屾鍏冧箣鏃匼n\n浠庡皬鏃跺€欑涓€娆＄湅鍒板姩婕紑濮嬶紝鎴戝氨琚繖涓厖婊℃兂璞″姏鐨勪笘鐣屾墍鍚稿紩銆俓n\n## 鍚挋浣滃搧\n\n姣忎釜浜洪兘鏈夎嚜宸辩殑鍚挋浣滃搧锛屽鎴戞潵璇?..\n\n## 鐜板湪\n\n鐜板湪鎴戜緷鐒朵繚鎸佺潃杩界暘鐨勪範鎯紝姣忎竴瀛ｉ兘浼氱簿蹇冩寫閫夈€?, '闅忕瑪', NULL);

-- 鎻掑叆娴嬭瘯鐣墽鏁版嵁
INSERT INTO animes (title, status, progress, rating, review) 
VALUES 
('鏂颁笘绾闊虫垬澹?, 'completed', '26/26', 10, '绁炰綔锛丄.T. Field 鐨勬蹇靛お闇囨捈浜嗐€?),
('楝肩伃涔嬪垉', 'completed', '26/26', 9, '浣滅敾绮剧編锛屽墽鎯呯揣鍑戙€?),
('鍜掓湳鍥炴垬', 'watching', '15/24', 8, '鎴樻枟鍦洪潰寰堟锛屾湡寰呭悗缁彂灞曘€?),
('钁€佺殑鑺欒帀鑾?, 'plan', '0/28', NULL, '鍚寰堟不鎰堬紝鍑嗗琛ョ暘銆?);

-- 7. 绯荤粺閰嶇疆琛?(The Core)
-- 鍗曡璁板綍锛屽瓨鍌ㄥ叏绔欒缃?
DROP TABLE IF EXISTS system_config;
DROP TABLE IF EXISTS system_settings;
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    config_json TEXT NOT NULL,       -- 瀛樺偍鎵€鏈夊紑鍏炽€佷富棰樿壊銆丼EO淇℃伅鐨?JSON
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
