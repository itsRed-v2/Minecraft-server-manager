# Minecraft Server Manager

J'ai longtemps déployé manuellement des serveurs minecraft sur mon serveur dédié. 
À chaque fois que je voulais démarrer un serveur ou l'arrêter, il fallait que je me connecte
en ssh au serveur. En plus, si mes amis voulaient jouer et que le serveur était éteint pour
une raison ou une autre, ils devaient m'envoyer un message et si je n'étais pas disponible,
ils ne pouvaient pas jouer...

C'est pour cela que j'ai créé ce service node.js. L'idée est d'avoir un bot discord qui
permet d'avoir plusieurs informations sur les serveurs (s'ils ont allumés, quelle est leur
adresse, combien de joueurs sont connectés...) et de pouvoir les éteindre ou les allumer
avec une simple commande.
