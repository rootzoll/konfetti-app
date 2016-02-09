INSERT INTO party (name, contact, detail_text, lat, lon, meters, visibility, review_level, new_request_min_konfetti, welcome_balance) VALUES ('Helferverein Nord e.V.', 'http://pankowhilft.blogsport.de', 'Berliner Str. 99, 13189 Berlin, GERMANY', 0, 0, 1000, 0, 1, 0, 100);
INSERT INTO request (user_id, party_id, state, title, time, user_name) VALUES (99, 1, 'open', 'Aufbau Informationsabend', 1323123123, 'Jochen');
INSERT INTO account (name, balance) VALUES ('r1', 12);
INSERT INTO request (user_id, party_id, state, title, time, user_name) VALUES (99, 1, 'open', 'Hilfe bei Einkäufen', 1323123126, 'Jada');
INSERT INTO account (name, balance) VALUES ('r2', 10);
INSERT INTO party (name, contact, detail_text, lat, lon, meters, visibility, review_level, new_request_min_konfetti, welcome_balance) VALUES ('Helferverein Süd e.V.', 'http://muenchen.blogsport.de', 'Antonplatz 3, 89282 München, GERMANY', 0, 0, 50000, 0, 0, 10, 10);