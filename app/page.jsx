'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const SESSION_KEY = 'raftelV47RiftPixelSession'
const POLL_INTERVAL = 10000
const IMMUNITY_10_MIN = 10 * 60 * 1000
const MAX_EVENTS = 90
const MAX_CHAT = 80
const DDRAGON_FALLBACK_VERSION = '15.24.1'
const DDRAGON_CDN = 'https://ddragon.leagueoflegends.com/cdn'
const DDRAGON_IMG = 'https://ddragon.leagueoflegends.com/cdn/img'

const championKeys = {
  "Cho'Gath": 'Chogath',
  "Kai'Sa": 'Kaisa',
  "Kha'Zix": 'Khazix',
  "Kog'Maw": 'KogMaw',
  "Lee Sin": 'LeeSin',
  "Master Yi": 'MasterYi',
  "Miss Fortune": 'MissFortune',
  "Nunu": 'Nunu',
  "Rek'Sai": 'RekSai',
  "Renata Glasc": 'Renata',
  "Tahm Kench": 'TahmKench',
  "Twisted Fate": 'TwistedFate',
  "Vel'Koz": 'Velkoz',
  "Xin Zhao": 'XinZhao',
  "Aurelion Sol": 'AurelionSol'
}

const summonerSpellData = [
  { name: 'Flash', key: 'SummonerFlash' },
  { name: 'Fantôme', key: 'SummonerHaste' },
  { name: 'Purge', key: 'SummonerBoost' },
  { name: 'Embrasement', key: 'SummonerDot' },
  { name: 'Barrière', key: 'SummonerBarrier' },
  { name: 'Soin', key: 'SummonerHeal' },
  { name: 'Fatigue', key: 'SummonerExhaust' },
  { name: 'Châtiment', key: 'SummonerSmite' },
  { name: 'Téléportation', key: 'SummonerTeleport' }
]

const runeTrees = [
  {
    name: 'Précision',
    slug: 'precision',
    icon: 'perk-images/Styles/7201_Precision.png',
    keystones: [
      { name: 'Attaque soutenue', icon: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png' },
      { name: 'Conquérant', icon: 'perk-images/Styles/Precision/Conqueror/Conqueror.png' },
      { name: 'Jeu de jambes', icon: 'perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png' }
    ],
    minors: [
      { name: 'Triomphe', icon: 'perk-images/Styles/Precision/Triumph.png' },
      { name: 'Légende : alacrité', icon: 'perk-images/Styles/Precision/LegendAlacrity/LegendAlacrity.png' },
      { name: 'Coup de grâce', icon: 'perk-images/Styles/Precision/CoupDeGrace/CoupDeGrace.png' },
      { name: 'Baroud d’honneur', icon: 'perk-images/Styles/Sorcery/LastStand/LastStand.png' }
    ]
  },
  {
    name: 'Domination',
    slug: 'domination',
    icon: 'perk-images/Styles/7200_Domination.png',
    keystones: [
      { name: 'Électrocution', icon: 'perk-images/Styles/Domination/Electrocute/Electrocute.png' },
      { name: 'Moisson noire', icon: 'perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png' },
      { name: 'Déluge de lames', icon: 'perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png' }
    ],
    minors: [
      { name: 'Coup bas', icon: 'perk-images/Styles/Domination/CheapShot/CheapShot.png' },
      { name: 'Goût du sang', icon: 'perk-images/Styles/Domination/TasteOfBlood/GreenTerror_TasteOfBlood.png' },
      { name: 'Arracheur d’œil', icon: 'perk-images/Styles/Domination/EyeballCollection/EyeballCollection.png' },
      { name: 'Chasseur ultime', icon: 'perk-images/Styles/Domination/UltimateHunter/UltimateHunter.png' }
    ]
  },
  {
    name: 'Sorcellerie',
    slug: 'sorcery',
    icon: 'perk-images/Styles/7202_Sorcery.png',
    keystones: [
      { name: 'Invocation d’Aery', icon: 'perk-images/Styles/Sorcery/SummonAery/SummonAery.png' },
      { name: 'Comète arcanique', icon: 'perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png' },
      { name: 'Rush phasique', icon: 'perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png' }
    ],
    minors: [
      { name: 'Ruban de mana', icon: 'perk-images/Styles/Sorcery/ManaflowBand/ManaflowBand.png' },
      { name: 'Transcendance', icon: 'perk-images/Styles/Sorcery/Transcendence/Transcendence.png' },
      { name: 'Brûlure', icon: 'perk-images/Styles/Sorcery/Scorch/Scorch.png' },
      { name: 'Tempête menaçante', icon: 'perk-images/Styles/Sorcery/GatheringStorm/GatheringStorm.png' }
    ]
  },
  {
    name: 'Volonté',
    slug: 'resolve',
    icon: 'perk-images/Styles/7204_Resolve.png',
    keystones: [
      { name: 'Poigne de l’immortel', icon: 'perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png' },
      { name: 'Après-coup', icon: 'perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png' },
      { name: 'Gardien', icon: 'perk-images/Styles/Resolve/Guardian/Guardian.png' }
    ],
    minors: [
      { name: 'Démolition', icon: 'perk-images/Styles/Resolve/Demolish/Demolish.png' },
      { name: 'Second souffle', icon: 'perk-images/Styles/Resolve/SecondWind/SecondWind.png' },
      { name: 'Surcroissance', icon: 'perk-images/Styles/Resolve/Overgrowth/Overgrowth.png' },
      { name: 'Inébranlable', icon: 'perk-images/Styles/Sorcery/Unflinching/Unflinching.png' }
    ]
  },
  {
    name: 'Inspiration',
    slug: 'inspiration',
    icon: 'perk-images/Styles/7203_Whimsy.png',
    keystones: [
      { name: 'Optimisation glaciale', icon: 'perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png' },
      { name: 'Grimoire déchaîné', icon: 'perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png' },
      { name: 'Premier coup', icon: 'perk-images/Styles/Inspiration/FirstStrike/FirstStrike.png' }
    ],
    minors: [
      { name: 'Chaussures magiques', icon: 'perk-images/Styles/Inspiration/MagicalFootwear/MagicalFootwear.png' },
      { name: 'Livraison de biscuits', icon: 'perk-images/Styles/Inspiration/BiscuitDelivery/BiscuitDelivery.png' },
      { name: 'Savoir cosmique', icon: 'perk-images/Styles/Inspiration/CosmicInsight/CosmicInsight.png' },
      { name: 'Vitesse d’approche', icon: 'perk-images/Styles/Resolve/ApproachVelocity/ApproachVelocity.png' }
    ]
  }
]

const braveryItems = [
  { name: 'Rabadon en premier', id: 3089 },
  { name: 'Force de la trinité', id: 3078 },
  { name: 'Zhonya obligatoire', id: 3157 },
  { name: 'Warmog spirituel', id: 3083 },
  { name: 'Liandry parce que pourquoi pas', id: 6653 },
  { name: 'Soif-de-sang mental', id: 3072 },
  { name: 'Lame de l’ego déchu', id: 3153 },
  { name: 'Médaillon de la honte', id: 3190 },
  { name: 'Rylai pour ralentir le projet', id: 3116 },
  { name: 'Lame d’infini de confiance', id: 3031 }
]


const randomPunishments = [
  'doit flash dans le vide au prochain endroit safe puis dire “pression psychologique”.',
  'doit ping “On my way” vers la base ennemie comme si c’était un call macro.',
  'doit acheter une pink ward et la présenter comme “mon objet mythique”.',
  'doit faire son prochain back dans un buisson et dire “je disparais de la map”.',
  'doit annoncer “je dive” avec confiance puis ne rien faire pendant 10 secondes.',
  'doit demander “on fait Nash ?” avant 15 minutes.',
  'doit dire “j’ai bait” après sa prochaine mort, même si personne n’a suivi.',
  'doit expliquer sa prochaine mort comme une stratégie coréenne interdite.',
  'doit appeler son champion “mon petit poulet” jusqu’à sa prochaine mort.',
  'doit dire “je suis la win condition” avant le prochain fight, peu importe son score.',
  'doit demander à toute l’équipe de jouer autour de lui même s’il est 0/7.',
  'doit faire une fausse interview LEC après sa prochaine mort.',
  'doit dire “le plan se déroule parfaitement” après la prochaine catastrophe.',
  'doit dire “j’ai lu son pathing” quand il se fait gank alors qu’il avait zéro vision.',
  'doit finir toutes ses phrases par “selon les datas” pendant 2 minutes.',
  'doit dire “draft gap” alors que vous êtes en normal game.',
  'doit expliquer son build comme une “secret tech coréenne”.',
  'doit se présenter comme “analyste macro” pendant 3 minutes.',
  'doit faire son prochain call avec une voix de coach énervé.',
  'doit dire “je suis weakside” après chaque phrase pendant 2 minutes.',
  'doit dire “open mid mentalement” mais continuer à tryhard.',
  'doit poser une ward et dire “vision diff” avec arrogance.',
  'doit annoncer son KDA à voix haute après chaque mort pendant 5 minutes.',
  'doit complimenter le pire joueur de la game avec sincérité forcée.',
  'doit demander pardon à son support, même s’il ne joue pas bot.',
  'doit dire “c’est winnable” après la prochaine action absolument perdue.',
  'doit faire un discours de motivation de 15 secondes après le prochain fight perdu.',
  'doit annoncer “gros call macro” avant de simplement recall.',
  'doit dire “j’ai tempo” après son prochain missplay.',
  'doit appeler Alilou “coach suprême” jusqu’au prochain objectif.'
]

const roulettePunishments = [
  'flash dans le vide au prochain endroit safe puis dit “ça crée de la pression”.',
  'fait un faux call Nashor avec énormément de confiance.',
  'ping danger sur lui-même pendant 5 secondes après sa prochaine erreur.',
  'doit jouer 2 minutes sans ping, donc probablement en souffrance mentale.',
  'doit communiquer uniquement en vocabulaire e-sport pendant 2 minutes.',
  'doit faire une interview d’après-mort comme s’il sortait de Worlds.',
  'doit annoncer “je prends la responsabilité” après la prochaine mort alliée.',
  'doit dire “on joue macro” après la prochaine action complètement débile.',
  'doit proposer un dive niveau 2 puis immédiatement dire “non je limit test”.',
  'doit appeler son jungler “capitaine” jusqu’au prochain objectif.',
  'doit dire “mon champion est faible early” même s’il joue Draven.',
  'doit faire semblant de coacher Alilou pendant 1 minute.',
  'doit expliquer son prochain sort raté comme un zoning volontaire.',
  'doit faire un call dragon alors que le dragon n’est pas encore là.',
  'doit dire “c’est une game de scaling” même si le Nexus est ouvert.',
  'doit demander un contrôle anti-dopage au joueur le plus feed.',
  'doit annoncer “je roam” puis rester immobile 10 secondes.',
  'doit vendre mentalement son âme à la macro pendant 2 minutes.',
  'doit dire “jungle diff” après le prochain objectif perdu, même si c’est lui le jungler.',
  'doit faire des excuses publiques au lobby après sa prochaine mort.'
]

const alilouCollectivePunishments = [
  'tout le monde doit dire “Alilou président”.',
  'tout le lobby doit appeler Alilou “coach suprême” jusqu’au prochain objectif.',
  'le prochain mort se fait interviewer par tout le monde.',
  'tout le monde doit dire “c’est winnable” après la prochaine catastrophe.',
  'pendant 1 minute, personne n’a le droit de dire “jungle diff”.',
  'tout le monde ping une seule fois “On my way” vers Nashor.',
  'le prochain objectif est call uniquement par Alilou.',
  'tout le monde annonce son KDA avec fierté.',
  'le prochain mort doit faire des excuses publiques.',
  'tout le lobby doit dire “merci coach Alilou”.',
  'tout le monde doit dire “draft gap” en même temps.',
  'la prochaine mauvaise idée devient officiellement une stratégie macro.'
]

const deathRoasts = [
  'a découvert que le gris était une couleur jouable.',
  'vient de créer de l’espace. Pour l’équipe ennemie.',
  'a confondu courage et inting artistique.',
  'vient de vérifier si la fontaine ennemie marchait encore.',
  'a tenté une stratégie coréenne non documentée.',
  'vient d’offrir un replay pédagogique à Riot.',
  'a respecté son powerspike 0/10 avec discipline.',
  'vient de mourir pour la vision, sans poser de ward.',
  'a pris un trade worth dans un univers parallèle.',
  'a activé le mode spectateur premium.'
]

const killRoasts = [
  'smurf suspect détecté.',
  'contrôle anti-dopage demandé.',
  'le clavier vient d’être branché.',
  'le script a clignoté deux secondes.',
  'l’équipe adverse demande un remake mental.',
  'la faille vient de buguer positivement.',
  'moment rare : une bonne décision a été prise.',
  'le coach Alilou valide temporairement.'
]

const shameRoasts = [
  'Le tribunal de la faille ouvre une enquête.',
  'Riot ne peut officiellement rien faire pour ce joueur.',
  'Le replay sera étudié par des bronzes diplômés.',
  'La macro vient de porter plainte.',
  'Le bouton flash était apparemment décoratif.',
  'Le mental collectif perd 12 LP.'
]


const braveryChampions = [
  'Aatrox', 'Ahri', 'Akali', 'Alistar', 'Amumu', 'Anivia', 'Annie', 'Aphelios', 'Ashe', 'Aurelion Sol',
  'Bard', 'Blitzcrank', 'Brand', 'Braum', 'Caitlyn', 'Camille', 'Cassiopeia', 'Cho\'Gath', 'Darius', 'Diana',
  'Draven', 'Ekko', 'Ezreal', 'Fiddlesticks', 'Fiora', 'Fizz', 'Garen', 'Gragas', 'Graves', 'Gwen',
  'Hecarim', 'Heimerdinger', 'Illaoi', 'Irelia', 'Janna', 'Jax', 'Jhin', 'Jinx', 'Kai\'Sa', 'Karma',
  'Karthus', 'Kassadin', 'Katarina', 'Kayle', 'Kayn', 'Kennen', 'Kha\'Zix', 'Kindred', 'Lee Sin', 'Leona',
  'Lillia', 'Lucian', 'Lulu', 'Lux', 'Malphite', 'Malzahar', 'Maokai', 'Master Yi', 'Milio', 'Miss Fortune',
  'Mordekaiser', 'Morgana', 'Nami', 'Nasus', 'Nautilus', 'Neeko', 'Nidalee', 'Nocturne', 'Nunu', 'Olaf',
  'Orianna', 'Pantheon', 'Poppy', 'Pyke', 'Qiyana', 'Rakan', 'Rammus', 'Renekton', 'Rengar', 'Riven',
  'Samira', 'Sejuani', 'Senna', 'Seraphine', 'Sett', 'Shaco', 'Shen', 'Singed', 'Sion', 'Sivir',
  'Skarner', 'Sona', 'Soraka', 'Swain', 'Sylas', 'Syndra', 'Tahm Kench', 'Taliyah', 'Talon', 'Teemo',
  'Thresh', 'Tristana', 'Trundle', 'Tryndamere', 'Twisted Fate', 'Twitch', 'Udyr', 'Urgot', 'Varus', 'Vayne',
  'Veigar', 'Vel\'Koz', 'Vex', 'Vi', 'Viego', 'Viktor', 'Vladimir', 'Volibear', 'Warwick', 'Wukong',
  'Xayah', 'Xerath', 'Xin Zhao', 'Yasuo', 'Yone', 'Yuumi', 'Zac', 'Zed', 'Zeri', 'Ziggs', 'Zilean', 'Zoe', 'Zyra'
]

const braveryLanes = ['Top', 'Jungle', 'Mid', 'ADC', 'Support', 'Simulateur River Shen']
const braverySummoners = [
  ['Flash', 'Fantôme'],
  ['Fantôme', 'Purge'],
  ['Embrasement', 'Barrière'],
  ['Soin', 'Fatigue'],
  ['Châtiment', 'Fantôme'],
  ['Téléportation', 'Purge'],
  ['Flash', 'Châtiment'],
  ['Barrière', 'Purge']
]
const braveryStarts = [
  'Start Doran Ring même si tu comprends pas pourquoi.',
  'Start bottes + potion, la vitesse avant la dignité.',
  'Start support item si ça passe légalement dans ta tête.',
  'Start long sword et confiance excessive.',
  'Start amplifying tome et annonce “secret tech coréenne”.',
  'Start cloth armor et joue comme un coffre-fort Lidl.',
  'Start tear et promets que tu scale avant 47 minutes.'
]
const braveryBuildRules = [
  'Premier gros item obligatoirement AP.',
  'Premier gros item obligatoirement AD.',
  'Premier gros item obligatoirement tank.',
  'Tu dois acheter des bottes seulement après ton deuxième item.',
  'Tu dois acheter une pink à chaque back jusqu’à manquer de dignité.',
  'Tu dois finir un item défensif avant tout item offensif.',
  'Tu dois acheter un item que personne ne comprend sur ton champion.',
  'Tu dois expliquer chaque achat comme si tu étais coach LEC.'
]
const braverySpellOrders = ['Max Q > W > E', 'Max Q > E > W', 'Max W > Q > E', 'Max W > E > Q', 'Max E > Q > W', 'Max E > W > Q']
const braveryRunes = [
  'Rune principale : celle qui te donne le plus confiance, pas celle qui marche.',
  'Rune principale : inspiration de génie, exécution de bronze.',
  'Rune principale : full scaling, même si la game finit avant tes chaussures.',
  'Rune principale : agressive, mais ton gameplay doit rester peureux.',
  'Rune principale : tank, même si tu joues un cure-dent.'
]
const braveryRules = [
  'Avant chaque objectif, tu dois dire “j’ai un plan macro”.',
  'À chaque mort, tu dois dire “c’était pour reset tempo”.',
  'Tu dois annoncer “je suis la win condition” au chargement.',
  'Tu dois ping une fois ton item le plus honteux après chaque kill.',
  'Tu n’as pas le droit de dire “jungle diff” pendant 10 minutes.',
  'Si tu rates un spell, tu dois dire “zoning volontaire”.',
  'Tu dois demander à l’équipe de jouer autour de toi, même en support 0/5.',
  'Ton premier flash offensif raté compte comme une réussite psychologique.',
  'Tu dois appeler ton build “RAFTEL Technology”.',
  'Tu dois vendre la stratégie comme si Riot allait la nerf demain.'
]
const braveryInsults = [
  'Le client LoL refuse de rembourser cette décision.',
  'Même l’ARAM trouve ça trop aléatoire.',
  'La faille vient de déposer une main courante.',
  'Build validé par aucun humain sérieux.',
  'Alilou observe, juge, puis prend des notes.',
  'La macro n’a pas survécu au chargement.'
]


const shameEvents = {
  firstblood: { label: '🩸 First blood subi', drinks: 2 },
  flash: { label: '⚡ Mort avec flash up', drinks: 3 },
  tower: { label: '🏰 Mort sous tour', drinks: 2 },
  easy: { label: '🤡 “Easy” puis mort', drinks: 4 },
  smite: { label: '🐉 Châtiment raté', drinks: 4 }
}

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value))
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now()
}

function makeRoomCode() {
  return 'RAF-' + Math.floor(1000 + Math.random() * 9000)
}

function makePin() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

function isAlilou(name = '') {
  return name.toLowerCase().includes('alilou')
}

function nowIso() {
  return new Date().toISOString()
}

function formatShortTime(dateString) {
  return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function getChampionKey(champion) {
  return championKeys[champion] || champion.replace(/[^A-Za-z0-9]/g, '')
}

function getSummonerSpell(name) {
  return summonerSpellData.find((spell) => spell.name === name) || summonerSpellData[0]
}

function championIconUrl(version, champion) {
  return `${DDRAGON_CDN}/${version}/img/champion/${getChampionKey(champion)}.png`
}

function itemIconUrl(version, itemId) {
  return `${DDRAGON_CDN}/${version}/img/item/${itemId}.png`
}

function spellIconUrl(version, spellKey) {
  return `${DDRAGON_CDN}/${version}/img/spell/${spellKey}.png`
}

function perkIconUrl(path) {
  return `${DDRAGON_IMG}/${path}`
}

function pickUnique(list, count) {
  const pool = [...list]
  const result = []
  while (result.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(index, 1)[0])
  }
  return result
}

function generateUltimateBravery(playerName = 'Invocateur') {
  const champion = pickRandom(braveryChampions)
  const lane = pickRandom(braveryLanes)
  const summonerNames = pickRandom(braverySummoners)
  const summoners = summonerNames.map(getSummonerSpell)
  const start = pickRandom(braveryStarts)
  const buildRule = pickRandom(braveryBuildRules)
  const spellOrder = pickRandom(braverySpellOrders)
  const primary = pickRandom(runeTrees)
  const secondary = pickRandom(runeTrees.filter((tree) => tree.name !== primary.name))
  const keystone = pickRandom(primary.keystones)
  const primaryMinors = pickUnique(primary.minors, 3)
  const secondaryMinors = pickUnique(secondary.minors, 2)
  const buildItems = pickUnique(braveryItems, 3)
  const rule = pickRandom(braveryRules)
  const insult = pickRandom(braveryInsults)

  const summaryText = [
    `🎲 BRAVOURE ULTIME — ${playerName}`,
    '',
    `Champion : ${champion}`,
    `Rôle : ${lane}`,
    `Sorts : ${summoners.map((spell) => spell.name).join(' + ')}`,
    `Spells : ${spellOrder}`,
    `Runes : ${primary.name} / ${secondary.name} — ${keystone.name}`,
    `Start : ${start}`,
    `Build : ${buildRule}`,
    `Items honteux : ${buildItems.map((item) => item.name).join(' → ')}`,
    '',
    `Règle honteuse : ${rule}`,
    '',
    `Verdict : ${insult}`
  ].join('\n')

  return {
    playerName,
    champion,
    lane,
    summoners,
    spellOrder,
    start,
    buildRule,
    primary,
    secondary,
    keystone,
    primaryMinors,
    secondaryMinors,
    buildItems,
    rule,
    insult,
    summaryText
  }
}


function getRemainingMs(player) {
  if (!player.immunityUntil) return 0
  return Math.max(0, new Date(player.immunityUntil).getTime() - Date.now())
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

function createPlayer(name) {
  return {
    id: makeId(),
    name,
    deaths: 0,
    drinks: 0,
    kills: 0,
    distributed: 0,
    punishmentsGiven: 0,
    braveryCount: 0,
    immunityUntil: null
  }
}

function createInitialState(hostName) {
  const players = []
  let hostPlayerId = null

  if (hostName.trim()) {
    const hostPlayer = createPlayer(hostName.trim())
    players.push(hostPlayer)
    hostPlayerId = hostPlayer.id
  }

  return {
    version: '4.8',
    theme: 'rift-pixel-ui-bravery',
    mode: 'simple',
    gameNumber: 1,
    players,
    events: [
      { id: makeId(), text: '🎮 Raftel lancé. La faille autorise officiellement les mauvaises décisions.', createdAt: nowIso() }
    ],
    chatMessages: [
      { id: makeId(), author: 'Système', text: 'Chat activé. Alcool optionnel, mauvaise foi obligatoire ❤️', createdAt: nowIso(), system: true }
    ],
    hostPlayerId
  }
}

function ensureStateShape(state) {
  if (!state.events) state.events = []
  if (!state.chatMessages) state.chatMessages = []
  if (!state.players) state.players = []
  if (!state.mode) state.mode = 'simple'
  if (!state.gameNumber) state.gameNumber = 1
  state.players.forEach((p) => { if (typeof p.braveryCount !== 'number') p.braveryCount = 0 })
}

function pushEvent(state, text) {
  ensureStateShape(state)
  state.events.unshift({ id: makeId(), text, createdAt: nowIso() })
  if (state.events.length > MAX_EVENTS) state.events = state.events.slice(0, MAX_EVENTS)
}

function pushChat(state, author, text, system = false) {
  ensureStateShape(state)
  state.chatMessages.push({ id: makeId(), author, text, createdAt: nowIso(), system })
  if (state.chatMessages.length > MAX_CHAT) state.chatMessages = state.chatMessages.slice(-MAX_CHAT)
}

function getPlayerTitle(player, players) {
  if (isAlilou(player.name)) return '😈 Maître des gages'

  const maxDeaths = Math.max(0, ...players.map((p) => p.deaths))
  const maxKills = Math.max(0, ...players.map((p) => p.kills))

  if (player.deaths > 0 && player.deaths === maxDeaths) return '💀 Roi de l’int'
  if (player.kills > 0 && player.kills === maxKills) return '⚔️ Smurf suspect'
  if (player.deaths >= 10) return '🔥 Powerspike 0/10'
  if (player.deaths >= 5) return '🧠 Mental boom'
  if (player.deaths >= 3) return '😭 Weakside enjoyer'
  if (player.deaths === 0 && player.kills > 0) return '🧼 Clean player'
  return '🎮 Invocateur'
}


function getPlayerAvatar(player, index = 0) {
  const avatars = ['🐧', '🐱', '🐺', '🦊', '🐸', '🦝', '🐲', '🦁', '🐼', '🦄']
  if (isAlilou(player.name)) return '😈'
  return avatars[index % avatars.length]
}

function getSummaryText(state) {
  const players = state.players || []
  if (players.length === 0) return 'Aucun joueur dans la room.'

  const king = [...players].sort((a, b) => b.deaths - a.deaths)[0]
  const mvp = [...players].sort((a, b) => b.kills - a.kills)[0]
  const drinker = [...players].sort((a, b) => b.drinks - a.drinks)[0]
  const punisher = [...players].sort((a, b) => b.punishmentsGiven - a.punishmentsGiven)[0]
  const bravest = [...players].sort((a, b) => (b.braveryCount || 0) - (a.braveryCount || 0))[0]
  const totalDeaths = players.reduce((sum, p) => sum + p.deaths, 0)
  const totalDrinks = players.reduce((sum, p) => sum + p.drinks, 0)
  const totalKills = players.reduce((sum, p) => sum + p.kills, 0)

  return [
    `🏁 RÉSUMÉ GAME ${state.gameNumber}`,
    '',
    `💀 Roi de l’int : ${king.name} (${king.deaths} morts)`,
    `⚔️ MVP kills : ${mvp.name} (${mvp.kills} kills)`,
    `🍺 Plus gros buveur : ${drinker.name} (${drinker.drinks} gorgées)`,
    `😈 Maître des gages : ${punisher.name} (${punisher.punishmentsGiven} gages)`,
    `🎲 Victime Bravoure : ${bravest.name} (${bravest.braveryCount || 0} tirages)`,
    '',
    `📊 Totaux`,
    `- Morts : ${totalDeaths}`,
    `- Kills : ${totalKills}`,
    `- Gorgées : ${totalDrinks}`,
    '',
    'Verdict : la faille vous juge, Alilou prend des notes.'
  ].join('\n')
}


function IconBubble({ src, alt, label, size = 'normal' }) {
  return (
    <div className={`icon-bubble icon-bubble-${size}`} title={label || alt}>
      <img src={src} alt={alt} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />
      <span>{label ? label.slice(0, 2).toUpperCase() : '??'}</span>
    </div>
  )
}

function RuneColumn({ title, tree, runes, featured }) {
  return (
    <section className={`rune-column rune-${tree.slug}`}>
      <div className="rune-tree-title">
        <IconBubble src={perkIconUrl(tree.icon)} alt={tree.name} label={tree.name} size="small" />
        <div>
          <span>{title}</span>
          <strong>{tree.name}</strong>
        </div>
      </div>

      {featured ? (
        <div className="keystone-slot">
          <IconBubble src={perkIconUrl(featured.icon)} alt={featured.name} label={featured.name} size="large" />
          <div>
            <span>Keystone</span>
            <strong>{featured.name}</strong>
          </div>
        </div>
      ) : null}

      <div className="rune-list">
        {runes.map((rune) => (
          <div className="rune-row" key={`${tree.name}-${rune.name}`}>
            <IconBubble src={perkIconUrl(rune.icon)} alt={rune.name} label={rune.name} size="small" />
            <span>{rune.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function BraveryRuneOverlay({ bravery, version, onClose }) {
  if (!bravery) return null

  return (
    <div className="overlay bravery-rune-overlay">
      <div className="rune-page-card">
        <div className="rune-page-header">
          <div className="champion-medallion">
            <img src={championIconUrl(version, bravery.champion)} alt={bravery.champion} onError={(event) => { event.currentTarget.style.display = 'none' }} />
            <span>{bravery.champion.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="rune-page-title">
            <span>Bravoure Ultime</span>
            <h2>{bravery.playerName}</h2>
            <p>{bravery.champion} — {bravery.lane}</p>
          </div>
          <button className="rune-close" onClick={onClose}>✕</button>
        </div>

        <div className="summoner-strip">
          {bravery.summoners.map((spell) => (
            <div className="summoner-card" key={spell.name}>
              <IconBubble src={spellIconUrl(version, spell.key)} alt={spell.name} label={spell.name} />
              <strong>{spell.name}</strong>
            </div>
          ))}
          <div className="spell-order-card">
            <span>Ordre des sorts</span>
            <strong>{bravery.spellOrder}</strong>
          </div>
        </div>

        <div className="rune-board">
          <RuneColumn title="Primaire" tree={bravery.primary} featured={bravery.keystone} runes={bravery.primaryMinors} />
          <RuneColumn title="Secondaire" tree={bravery.secondary} runes={bravery.secondaryMinors} />
        </div>

        <div className="build-board">
          <section className="build-panel">
            <h3>Build de la honte</h3>
            <div className="item-chain">
              {bravery.buildItems.map((item) => (
                <div className="item-card" key={item.id}>
                  <IconBubble src={itemIconUrl(version, item.id)} alt={item.name} label={item.name} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
            <p><strong>Start :</strong> {bravery.start}</p>
            <p><strong>Règle build :</strong> {bravery.buildRule}</p>
          </section>

          <section className="build-panel verdict-panel">
            <h3>Décret RAFTEL</h3>
            <p>{bravery.rule}</p>
            <div className="verdict-line">{bravery.insult}</div>
          </section>
        </div>

        <div className="rune-page-footer">
          <span>Icônes chargées via Riot Data Dragon • Patch {version}</span>
          <button className="neon-button" onClick={onClose}>Valider la honte</button>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const [roomRow, setRoomRow] = useState(null)
  const [role, setRole] = useState('spectator')
  const [currentPlayerId, setCurrentPlayerId] = useState(null)

  const [createHostName, setCreateHostName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')
  const [joinPin, setJoinPin] = useState('')
  const [addPlayerName, setAddPlayerName] = useState('')
  const [chatText, setChatText] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [overlayText, setOverlayText] = useState('')
  const [braveryOverlay, setBraveryOverlay] = useState(null)
  const [ddragonVersion, setDdragonVersion] = useState(DDRAGON_FALLBACK_VERSION)
  const [loading, setLoading] = useState(false)
  const [sideTab, setSideTab] = useState('events')
  const [lastActionAt, setLastActionAt] = useState(0)

  const hideMessageRef = useRef(null)
  const chatEndRef = useRef(null)

  const roomState = roomRow?.state || null
  const players = roomState?.players || []
  const events = roomState?.events || []
  const chatMessages = roomState?.chatMessages || []
  const isHost = role === 'host'
  const isGuest = role === 'guest'
  const isSpectator = role === 'spectator'
  const currentPlayer = players.find((p) => p.id === currentPlayerId) || null

  const myDisplayName = useMemo(() => {
    if (currentPlayer?.name) return currentPlayer.name
    if (isHost) return 'Host'
    return 'Spectateur'
  }, [currentPlayer, isHost])

  const roomUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.origin
  }, [roomRow?.id])

  const announce = useCallback((text) => {
    setMessage(text)
    if (hideMessageRef.current) clearTimeout(hideMessageRef.current)
    hideMessageRef.current = setTimeout(() => setMessage(''), 2500)
  }, [])

  const refreshRoom = useCallback(async (roomId) => {
    if (!supabase || !roomId) return

    const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single()
    if (data) setRoomRow(data)
  }, [])

  const updateRoomState = useCallback(async (mutator, successMessage = '') => {
    if (!supabase || !roomRow) return

    const now = Date.now()
    if (now - lastActionAt < 250) return
    setLastActionAt(now)

    const nextState = deepCopy(roomRow.state)
    ensureStateShape(nextState)
    mutator(nextState)

    const optimistic = { ...roomRow, state: nextState }
    setRoomRow(optimistic)

    const { data, error: updateError } = await supabase
      .from('rooms')
      .update({ state: nextState, updated_at: nowIso() })
      .eq('id', roomRow.id)
      .select('*')
      .single()

    if (updateError || !data) {
      setError('Impossible de synchroniser la room.')
      await refreshRoom(roomRow.id)
      return
    }

    setRoomRow(data)
    if (successMessage) announce(successMessage)
  }, [announce, lastActionAt, refreshRoom, roomRow])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const session = getSession()
    if (!session?.roomId) return

    async function restoreRoom() {
      const { data } = await supabase.from('rooms').select('*').eq('id', session.roomId).single()
      if (!data) {
        clearSession()
        return
      }

      setRoomRow(data)
      setRole(session.role || 'spectator')
      setCurrentPlayerId(session.playerId || null)
      setJoinCode(data.code)
    }

    restoreRoom()
  }, [])

  useEffect(() => {
    if (!supabase || !roomRow?.id) return

    const channel = supabase
      .channel(`room-${roomRow.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomRow.id}` },
        (payload) => {
          setRoomRow(payload.new)
        }
      )
      .subscribe()

    const poll = setInterval(() => refreshRoom(roomRow.id), POLL_INTERVAL)

    return () => {
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [refreshRoom, roomRow?.id])

  useEffect(() => {
    const timer = setInterval(() => {
      setRoomRow((current) => {
        if (!current?.state?.players) return current

        let changed = false
        const next = deepCopy(current)
        next.state.players = next.state.players.map((p) => {
          if (p.immunityUntil && new Date(p.immunityUntil).getTime() <= Date.now()) {
            changed = true
            return { ...p, immunityUntil: null }
          }
          return p
        })

        return changed ? next : current
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [chatMessages.length, sideTab])

  useEffect(() => {
    let cancelled = false

    async function loadLatestDdragonVersion() {
      try {
        const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')
        const versions = await response.json()
        if (!cancelled && Array.isArray(versions) && versions[0]) setDdragonVersion(versions[0])
      } catch {
        // Fallback volontaire : les icônes restent fonctionnelles si Data Dragon ne répond pas.
      }
    }

    loadLatestDdragonVersion()
    return () => { cancelled = true }
  }, [])

  async function createRoom() {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase n’est pas configurée.')
      return
    }

    setLoading(true)
    setError('')

    const code = makeRoomCode()
    const pin = makePin()
    const initialState = createInitialState(createHostName)
    const hostPlayerId = initialState.hostPlayerId || null

    const { data, error: createError } = await supabase
      .from('rooms')
      .insert({ code, host_pin: pin, state: initialState })
      .select('*')
      .single()

    setLoading(false)

    if (createError || !data) {
      setError('Impossible de créer la room.')
      return
    }

    setRoomRow(data)
    setRole('host')
    setCurrentPlayerId(hostPlayerId)
    saveSession({ roomId: data.id, roomCode: data.code, role: 'host', playerId: hostPlayerId, hostPin: pin })
    setJoinCode(data.code)
    announce(`Room créée. PIN host : ${pin}`)
  }

  async function joinRoom() {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase n’est pas configurée.')
      return
    }

    if (!joinCode.trim()) {
      setError('Entre un code de room.')
      return
    }

    setLoading(true)
    setError('')

    const code = joinCode.trim().toUpperCase()
    const { data, error: joinError } = await supabase.from('rooms').select('*').eq('code', code).single()

    if (joinError || !data) {
      setLoading(false)
      setError('Room introuvable.')
      return
    }

    if (joinPin.trim() && joinPin.trim() === data.host_pin) {
      setRoomRow(data)
      setRole('host')
      setCurrentPlayerId(data.state.hostPlayerId || null)
      saveSession({ roomId: data.id, roomCode: data.code, role: 'host', playerId: data.state.hostPlayerId || null, hostPin: joinPin.trim() })
      setLoading(false)
      announce('Connexion en host.')
      return
    }

    if (joinName.trim()) {
      const state = deepCopy(data.state)
      ensureStateShape(state)
      const existing = state.players.find((p) => p.name.toLowerCase() === joinName.trim().toLowerCase())
      const player = existing || createPlayer(joinName.trim())

      if (!existing) {
        state.players.push(player)
        pushEvent(state, `👤 ${player.name} rejoint la room.`)
        pushChat(state, 'Système', `${player.name} rejoint la room.`, true)
      }

      const { data: updatedRoom, error: updateError } = await supabase
        .from('rooms')
        .update({ state, updated_at: nowIso() })
        .eq('id', data.id)
        .select('*')
        .single()

      setLoading(false)

      if (updateError || !updatedRoom) {
        setError('Impossible de rejoindre comme invité.')
        return
      }

      setRoomRow(updatedRoom)
      setRole('guest')
      setCurrentPlayerId(player.id)
      saveSession({ roomId: updatedRoom.id, roomCode: updatedRoom.code, role: 'guest', playerId: player.id, hostPin: '' })
      announce('Tu as rejoint comme invité.')
      return
    }

    setRoomRow(data)
    setRole('spectator')
    setCurrentPlayerId(null)
    saveSession({ roomId: data.id, roomCode: data.code, role: 'spectator', playerId: null, hostPin: '' })
    setLoading(false)
    announce('Connexion en spectateur.')
  }

  function quitRoom() {
    clearSession()
    setRoomRow(null)
    setRole('spectator')
    setCurrentPlayerId(null)
    setCreateHostName('')
    setJoinCode('')
    setJoinName('')
    setJoinPin('')
    setAddPlayerName('')
    setChatText('')
    setOverlayText('')
    setBraveryOverlay(null)
    setError('')
    setMessage('')
  }

  function canControl(player) {
    return isHost || (isGuest && currentPlayerId === player.id)
  }

  function handleDeath(playerId) {
    updateRoomState((state) => {
      const p = state.players.find((entry) => entry.id === playerId)
      if (!p) return

      p.deaths += 1
      const immune = p.immunityUntil && new Date(p.immunityUntil).getTime() > Date.now()

      if (!immune && !isAlilou(p.name)) p.drinks += 1

      pushEvent(state, `💀 ${p.name} ${deathRoasts[Math.floor(Math.random() * deathRoasts.length)]}`)

      if (p.deaths === 3 && !immune && !isAlilou(p.name)) {
        p.drinks += 1
        pushEvent(state, `😭 ${p.name} atteint 3 morts → +1 gorgée.`)
      }

      if (p.deaths === 5 && !immune && !isAlilou(p.name)) {
        p.drinks += 2
        pushEvent(state, `📉 ${p.name} atteint 5 morts → +2 gorgées.`)
      }

      if (p.deaths === 10) {
        p.immunityUntil = new Date(Date.now() + IMMUNITY_10_MIN).toISOString()
        pushEvent(state, `🛡️ ${p.name} atteint 10 morts → immunité 10 min.`)
      }
    }, 'Mort enregistrée.')
  }

  function handleEarlyZeroThree(playerId) {
    updateRoomState((state) => {
      const p = state.players.find((entry) => entry.id === playerId)
      if (!p) return
      p.immunityUntil = new Date(Date.now() + IMMUNITY_10_MIN).toISOString()
      pushEvent(state, `🛡️ ${p.name} fait 0/3 avant 2 min → immunité 10 min.`)
    }, 'Immunité activée.')
  }

  function applyKill(playerId, type) {
    updateRoomState((state) => {
      const p = state.players.find((entry) => entry.id === playerId)
      if (!p) return

      const killValues = { double: 2, triple: 3, quadra: 4, penta: 5 }
      p.kills += killValues[type] || 0

      if (isAlilou(p.name)) {
        p.punishmentsGiven += 1
        const label = type === 'double' ? 'doublé → gage léger' : type === 'triple' ? 'triplé → gage moyen' : type === 'quadra' ? 'quadruplé → gros gage' : 'pentakill → gage collectif'
        const gage = type === 'penta' ? alilouCollectivePunishments[Math.floor(Math.random() * alilouCollectivePunishments.length)] : randomPunishments[Math.floor(Math.random() * randomPunishments.length)]
        pushEvent(state, `😈 Alilou fait un ${label}. Le décret du coach tombe.`)
        pushEvent(state, `🎭 ${gage}`)
        pushChat(state, 'Alilou Bot', `😈 Alilou active un gage : ${gage}`, true)
        return
      }

      if (type === 'double') pushEvent(state, `⚔️ ${p.name} fait un doublé — ${killRoasts[Math.floor(Math.random() * killRoasts.length)]}`)
      if (type === 'triple') {
        p.distributed += 1
        pushEvent(state, `🔥 ${p.name} fait un triplé → distribue 1 gorgée. ${killRoasts[Math.floor(Math.random() * killRoasts.length)]}`)
      }
      if (type === 'quadra') {
        p.distributed += 2
        pushEvent(state, `👑 ${p.name} fait un quadruplé → distribue 2 gorgées. ${killRoasts[Math.floor(Math.random() * killRoasts.length)]}`)
      }
      if (type === 'penta') {
        state.players.forEach((target) => {
          const immune = target.immunityUntil && new Date(target.immunityUntil).getTime() > Date.now()
          if (target.id !== p.id && !immune && !isAlilou(target.name)) target.drinks += 1
        })
        pushEvent(state, `🏆 ${p.name} fait un pentakill → tout le monde sauf lui boit 1.`)
        pushChat(state, 'Système', `🏆 PENTAKILL de ${p.name}. La faille tremble.`, true)
      }
    }, 'Kill enregistré.')
  }

  function handleGage(playerId) {
    updateRoomState((state) => {
      const p = state.players.find((entry) => entry.id === playerId)
      if (!p) return

      const gage = randomPunishments[Math.floor(Math.random() * randomPunishments.length)]
      p.punishmentsGiven += 1
      pushEvent(state, `🎭 Gage pour ${p.name} : ${gage}`)
      pushChat(state, 'Système', `🎭 ${p.name} ${gage}`, true)
    }, 'Gage appliqué.')
  }

  function handleExpertEvent(playerId, kind) {
    updateRoomState((state) => {
      const p = state.players.find((entry) => entry.id === playerId)
      if (!p) return

      const item = shameEvents[kind]
      const immune = p.immunityUntil && new Date(p.immunityUntil).getTime() > Date.now()
      if (!immune && !isAlilou(p.name)) p.drinks += item.drinks
      pushEvent(state, `${item.label} : ${p.name} → +${item.drinks} gorgées si applicable. ${shameRoasts[Math.floor(Math.random() * shameRoasts.length)]}`)
    }, 'Événement expert appliqué.')
  }

  function handleMinusDeath(playerId) {
    updateRoomState((state) => {
      const p = state.players.find((entry) => entry.id === playerId)
      if (!p) return
      p.deaths = Math.max(0, p.deaths - 1)
      pushEvent(state, `↩️ -1 mort pour ${p.name}.`)
    }, 'Correction appliquée.')
  }

  function handleMinusDrink(playerId) {
    updateRoomState((state) => {
      const p = state.players.find((entry) => entry.id === playerId)
      if (!p) return
      p.drinks = Math.max(0, p.drinks - 1)
      pushEvent(state, `↩️ -1 gorgée pour ${p.name}.`)
    }, 'Correction appliquée.')
  }

  function handleResetPlayer(playerId) {
    if (!isHost) return
    updateRoomState((state) => {
      const p = state.players.find((entry) => entry.id === playerId)
      if (!p) return
      p.deaths = 0
      p.drinks = 0
      p.kills = 0
      p.distributed = 0
      p.punishmentsGiven = 0
      p.braveryCount = 0
      p.immunityUntil = null
      pushEvent(state, `♻️ ${p.name} a été reset.`)
    }, 'Joueur reset.')
  }

  function handleAddPlayer() {
    if (!isHost || !addPlayerName.trim()) return
    const name = addPlayerName.trim()

    updateRoomState((state) => {
      const player = createPlayer(name)
      state.players.push(player)
      pushEvent(state, `👤 ${name} a été ajouté à la room.`)
      pushChat(state, 'Système', `${name} a été ajouté à la room.`, true)
    }, 'Joueur ajouté.')

    setAddPlayerName('')
  }

  function handleNewGame() {
    if (!isHost) return

    updateRoomState((state) => {
      state.gameNumber += 1
      state.players = state.players.map((p) => ({
        ...p,
        deaths: 0,
        drinks: 0,
        kills: 0,
        distributed: 0,
        punishmentsGiven: 0,
        braveryCount: 0,
        immunityUntil: null
      }))
      pushEvent(state, `🎮 Nouvelle game ${state.gameNumber}.`)
      pushChat(state, 'Système', `🎮 Nouvelle game ${state.gameNumber}. GLHF.`, true)
    }, 'Nouvelle game lancée.')
  }

  function handleToggleMode() {
    if (!isHost) return

    updateRoomState((state) => {
      state.mode = state.mode === 'simple' ? 'expert' : 'simple'
      pushEvent(state, `⚙️ Mode ${state.mode} activé.`)
    }, 'Mode changé.')
  }

  function handleRoulette() {
    if (!isHost || !players.length) return

    const target = players[Math.floor(Math.random() * players.length)]
    const punishment = roulettePunishments[Math.floor(Math.random() * roulettePunishments.length)]

    updateRoomState((state) => {
      pushEvent(state, `🎲 Roulette : ${target.name} ${punishment}`)
      pushChat(state, 'Roulette', `🎲 ${target.name} ${punishment}`, true)
    }, 'Roulette lancée.')

    setBraveryOverlay(null)
    setOverlayText(`🎲 ROULETTE\n\n${target.name}\n${punishment}`)
  }

  function handleUltimateBravery(playerId) {
    const target = players.find((p) => p.id === playerId)
    if (!target) return

    const bravery = generateUltimateBravery(target.name)
    const braveryText = bravery.summaryText

    updateRoomState((state) => {
      const p = state.players.find((entry) => entry.id === playerId)
      if (!p) return
      p.braveryCount = (p.braveryCount || 0) + 1
      pushEvent(state, `🎲 Bravoure Ultime pour ${p.name}. Le build est illégal moralement.`)
      pushChat(state, 'Bot Bravoure', braveryText, true)
    }, 'Bravoure Ultime générée.')

    setOverlayText('')
    setBraveryOverlay(bravery)
  }

  function handleRandomUltimateBravery() {
    if (!isHost || !players.length) return
    const target = players[Math.floor(Math.random() * players.length)]
    handleUltimateBravery(target.id)
  }


  function handleSummary() {
    if (!roomState) return
    const summary = getSummaryText(roomState)
    setBraveryOverlay(null)
    setOverlayText(summary)
  }

  function handleSendChat(event) {
    event.preventDefault()
    const text = chatText.trim()
    if (!text || !roomRow) return

    updateRoomState((state) => {
      pushChat(state, myDisplayName, text, false)
    })

    setChatText('')
    setSideTab('chat')
  }

  function handleClearChat() {
    if (!isHost) return
    updateRoomState((state) => {
      state.chatMessages = [
        { id: makeId(), author: 'Système', text: 'Chat nettoyé par le host.', createdAt: nowIso(), system: true }
      ]
    }, 'Chat vidé.')
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="page-shell">
        <div className="landing-card">
          <h1 className="brand-title">RAFTEL</h1>
          <p className="brand-subtitle">Supabase n’est pas configurée.</p>
          <p className="muted-line">
            Vérifie <strong>.env.local</strong> en local ou les variables d’environnement sur Vercel.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div className="bg-grid" />
      <div className="bg-glow bg-glow-one" />
      <div className="bg-glow bg-glow-two" />

      {message ? <div className="toast-message">{message}</div> : null}
      {error ? <button className="toast-error" onClick={() => setError('')}>{error}</button> : null}

      {braveryOverlay ? (
        <BraveryRuneOverlay bravery={braveryOverlay} version={ddragonVersion} onClose={() => setBraveryOverlay(null)} />
      ) : null}

      {overlayText ? (
        <div className="overlay">
          <div className="overlay-card">
            <pre>{overlayText}</pre>
            <button className="neon-button" onClick={() => setOverlayText('')}>Fermer</button>
          </div>
        </div>
      ) : null}

      {!roomRow ? (
        <div className="landing-card landing-hero">
          <div className="rift-emblem" aria-hidden="true"><span>✦</span></div>
          <div className="badge-line"><span className="status-dot" /> LOBBY PRIVÉ — FAILLE DE L’INVOCATEUR</div>
          <div className="title-lockup"><div className="crest-big" aria-hidden="true">✦</div><h1 className="brand-title">RAFTEL</h1><div className="crest-big" aria-hidden="true">✦</div></div>
          <p className="brand-subtitle">La faille privée des mauvaises décisions : host, invités, roulette, gages LoL et tribunal de la honte.</p>

          <div className="landing-grid">
            <section className="panel">
              <h2>Créer une soirée</h2>
              <p className="panel-text">Tu deviens host et tu contrôles toute la room.</p>
              <input className="neon-input" placeholder="Ton pseudo host (optionnel)" value={createHostName} onChange={(e) => setCreateHostName(e.target.value)} />
              <button className="neon-button neon-button-primary" onClick={createRoom} disabled={loading}>{loading ? 'Création...' : 'Créer une room'}</button>
            </section>

            <section className="panel">
              <h2>Rejoindre une soirée</h2>
              <p className="panel-text">Sans PIN = invité joueur ou spectateur. Avec PIN = host.</p>
              <input className="neon-input" placeholder="Code room (ex: RAF-4821)" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
              <input className="neon-input" placeholder="Ton pseudo (vide = spectateur)" value={joinName} onChange={(e) => setJoinName(e.target.value)} />
              <input className="neon-input" placeholder="PIN admin (optionnel)" value={joinPin} onChange={(e) => setJoinPin(e.target.value)} />
              <button className="neon-button neon-button-primary" onClick={joinRoom} disabled={loading}>{loading ? 'Connexion...' : 'Rejoindre'}</button>
            </section>
          </div>

          <div className="safe-banner"><strong>❤️ Rappel :</strong> l’alcool n’est jamais obligatoire. Une gorgée peut être remplacée par eau, soft ou gage.</div>
        </div>
      ) : (
        <div className="room-shell">
          <header className="topbar panel league-header">
            <div className="topbar-left"><div className="header-blade" aria-hidden="true" />
              <div className="rift-emblem top-emblem" aria-hidden="true"><span>◆</span></div>
              <div className="top-title-wrap">
              <div className="badge-line"><span className="status-dot" /> ROOM ACTIVE</div>
              <h1 className="brand-title brand-title-small">RAFTEL</h1>
              <div className="brand-subtitle room-subtitle">Faille de l’invocateur — tribunal de la macro</div>
              </div>
              <div className="room-info-stack">
                <span><strong>Code room</strong>{roomRow.code}</span>
                <span><strong>Partie</strong>#{roomState.gameNumber}</span>
                <span><strong>Mode</strong>{roomState.mode}</span>
                <span className="url-pill"><strong>URL</strong>{roomUrl}</span>
              </div>
            </div>

            <div className="topbar-right">
              <div className="role-card">
                {isHost ? '👑 HOST' : null}
                {isGuest ? '🎮 INVITÉ' : null}
                {isSpectator ? '👀 SPECTATEUR' : null}
                {isGuest && currentPlayer ? ` — ${currentPlayer.name}` : null}
              </div>
              <button className="neon-button" onClick={quitRoom}>🚪 Quitter</button>
            </div>
          </header>

          <section className="dashboard-grid">
            <aside className="left-column">
              <div className="panel">
                <h2>Contrôle room</h2>
                {isHost ? (
                  <>
                    <div className="row-inputs">
                      <input className="neon-input no-margin" placeholder="Ajouter un joueur" value={addPlayerName} onChange={(e) => setAddPlayerName(e.target.value)} />
                      <button className="neon-button" onClick={handleAddPlayer}>Ajouter</button>
                    </div>

                    <div className="action-grid compact-grid">
                      <button className="neon-button" onClick={handleNewGame}>🎮 Nouvelle game</button>
                      <button className="neon-button" onClick={handleToggleMode}>⚙️ Mode {roomState.mode === 'simple' ? 'expert' : 'simple'}</button>
                      <button className="neon-button" onClick={handleRoulette}>🎲 Roulette</button>
                      <button className="neon-button bravery-button" onClick={handleRandomUltimateBravery}>🎲 Bravoure</button>
                      <button className="neon-button" onClick={handleSummary}>🏁 Résumé</button>
                    </div>
                  </>
                ) : (
                  <p className="panel-text">Seul le host contrôle les actions globales. Les invités gèrent uniquement leur joueur.</p>
                )}
              </div>

              <div className="panel">
                <h2>Règles rapides</h2>
                <ul className="rule-list">
                  <li>💀 Mort = 1 gorgée.</li>
                  <li>😭 3 morts = +1.</li>
                  <li>📉 5 morts = +2.</li>
                  <li>🛡️ 10 morts = immunité 10 min.</li>
                  <li>⚡ 0/3 avant 2 min = immunité 10 min.</li>
                  <li>🔥 Triplé = distribue 1.</li>
                  <li>👑 Quadra = distribue 2.</li>
                  <li>🏆 Penta = tout le monde sauf lui boit 1.</li>
                  <li>😈 Alilou ne boit jamais : il donne des gages.</li>
                </ul>
              </div>

              <div className="panel bravery-panel">
                <h2>Bravoure Ultime</h2>
                <p className="panel-text">Un build maudit pour condamner un joueur à une game de pure mauvaise foi.</p>
                <button className="neon-button bravery-button full-width" disabled={!isHost || players.length === 0} onClick={handleRandomUltimateBravery}>🎲 Tirage random</button>
                <div className="bravery-mini">Champion • Lane • Sorts d’invocateur • Ordre des sorts • Build • Règle honteuse</div>
              </div>

              <div className="panel side-panel">
                <div className="tab-row">
                  <button className={sideTab === 'events' ? 'tab active' : 'tab'} onClick={() => setSideTab('events')}>📜 Journal</button>
                  <button className={sideTab === 'chat' ? 'tab active' : 'tab'} onClick={() => setSideTab('chat')}>💬 Chat</button>
                </div>

                {sideTab === 'events' ? (
                  <div className="event-list">
                    {events.length === 0 ? <div className="event-item">Aucun événement.</div> : events.map((event) => (
                      <div className="event-item" key={event.id}>
                        <span className="event-time">{formatShortTime(event.createdAt)}</span>
                        <span>{event.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="chat-box">
                    <div className="chat-list">
                      {chatMessages.map((msg) => (
                        <div className={msg.system ? 'chat-message system' : 'chat-message'} key={msg.id}>
                          <div className="chat-meta">
                            <strong>{msg.author}</strong>
                            <span>{formatShortTime(msg.createdAt)}</span>
                          </div>
                          <div className="chat-text">{msg.text}</div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    <form className="chat-form" onSubmit={handleSendChat}>
                      <input className="neon-input no-margin" maxLength={180} placeholder="Écrire dans le chat..." value={chatText} onChange={(e) => setChatText(e.target.value)} />
                      <button className="neon-button" type="submit">Envoyer</button>
                    </form>

                    {isHost ? (
                      <button className="neon-button clear-chat" onClick={handleClearChat}>🧹 Vider le chat</button>
                    ) : null}
                  </div>
                )}
              </div>
            </aside>

            <section className="players-column">
              <div className="lobby-board-title"><span>Slots joueurs</span><strong>{players.length}/10</strong></div>
              {players.length === 0 ? <div className="empty-lobby panel">Aucun champion verrouillé. Ajoute les invocateurs avant que la file parte en clown fiesta.</div> : null}
              <div className="players-grid">
                {players.map((player) => {
                  const controllable = canControl(player)
                  const remaining = getRemainingMs(player)
                  const expert = roomState.mode === 'expert'

                  return (
                    <article className={isAlilou(player.name) ? 'player-card alilou-card' : 'player-card'} key={player.id}>
                      <div className="corner-rank">{players.indexOf(player) + 1}</div>
                      <div className="player-frame">
                        <div className="player-portrait-wrap" aria-hidden="true">
                          <div className="portrait-ring"><div className="player-portrait">{getPlayerAvatar(player, players.indexOf(player))}</div></div>
                        </div>
                        <div className="player-main">
                          <div className="player-top">
                            <div>
                              <h3>{player.name}</h3>
                              <p className="player-title">{getPlayerTitle(player, players)}</p>
                            </div>
                            <div className="player-badges">
                              {currentPlayerId === player.id ? <span className="mini-badge">TOI</span> : null}
                              {isAlilou(player.name) ? <span className="mini-badge mini-badge-purple">ALILOU</span> : null}
                            </div>
                          </div>

                          {remaining > 0 ? <div className="immunity-box">🛡️ Immunité : {formatRemaining(remaining)}</div> : null}

                          <div className="stats-grid">
                        <div className="stat-box"><span>Morts</span><strong className="stat-deaths">{player.deaths}</strong></div>
                        <div className="stat-box"><span>Gorgées</span><strong className="stat-drinks">{player.drinks}</strong></div>
                        <div className="stat-box"><span>Kills</span><strong className="stat-kills">{player.kills}</strong></div>
                        <div className="stat-box"><span>{isAlilou(player.name) ? 'Gages donnés' : 'Données'}</span><strong className="stat-given">{isAlilou(player.name) ? player.punishmentsGiven : player.distributed}</strong></div>
                          </div>
                        </div>
                      </div>

                      <div className="action-grid">
                        <button className="neon-button neon-button-danger" disabled={!controllable} onClick={() => handleDeath(player.id)}>💀 Mort</button>
                        <button className="neon-button" disabled={!controllable} onClick={() => handleEarlyZeroThree(player.id)}>🛡️ 0/3 &lt; 2 min</button>
                        <button className="neon-button" disabled={!controllable} onClick={() => applyKill(player.id, 'double')}>⚔️ Doublé</button>
                        <button className="neon-button" disabled={!controllable} onClick={() => applyKill(player.id, 'triple')}>🔥 Triplé</button>
                        <button className="neon-button" disabled={!controllable} onClick={() => applyKill(player.id, 'quadra')}>👑 Quadra</button>
                        <button className="neon-button" disabled={!controllable} onClick={() => applyKill(player.id, 'penta')}>🏆 Penta</button>
                        <button className="neon-button" disabled={!controllable} onClick={() => handleGage(player.id)}>🎭 Gage</button>
                        <button className="neon-button bravery-button" disabled={!controllable} onClick={() => handleUltimateBravery(player.id)}>🎲 Bravoure</button>
                        <button className="neon-button" disabled={!controllable} onClick={() => handleMinusDeath(player.id)}>↩️ -1 mort</button>
                        <button className="neon-button" disabled={!controllable} onClick={() => handleMinusDrink(player.id)}>↩️ -1 gorgée</button>
                        {isHost ? <button className="neon-button" onClick={() => handleResetPlayer(player.id)}>♻️ Reset</button> : null}
                      </div>

                      {expert ? (
                        <div className="expert-block">
                          <div className="expert-title">Mode expert</div>
                          <div className="action-grid compact-grid">
                            <button className="neon-button" disabled={!controllable} onClick={() => handleExpertEvent(player.id, 'firstblood')}>🩸 First blood</button>
                            <button className="neon-button" disabled={!controllable} onClick={() => handleExpertEvent(player.id, 'flash')}>⚡ Flash up</button>
                            <button className="neon-button" disabled={!controllable} onClick={() => handleExpertEvent(player.id, 'tower')}>🏰 Sous tour</button>
                            <button className="neon-button" disabled={!controllable} onClick={() => handleExpertEvent(player.id, 'easy')}>🤡 Easy puis mort</button>
                            <button className="neon-button" disabled={!controllable} onClick={() => handleExpertEvent(player.id, 'smite')}>🐉 Châtiment raté</button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </section>
          </section>
        </div>
      )}
    </main>
  )
}
