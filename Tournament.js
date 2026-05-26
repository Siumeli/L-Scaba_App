/**
 * LÖSCABA - TURNAUSLOGIIKKA
 * Tämä koodi sisältää logiikan parittomien yhdistämiseen, lohkojen jakamiseen
 * sekä Round Robin -otteluohjelman luomiseen LöScaba-taulukon mukaisesti.
 */

// --- 1. APUFUNKTIOT ---

/**
 * Sekoittaa taulukon alkiot satunnaiseen järjestykseen (Fisher-Yates shuffle).
 */
function shuffleArray(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// --- 2. YDINFUNKTIOT (ADMIN PANEELIN TOIMINNOT) ---

/**
 * TOIMINTO: Neluriparien muodostus parittomista ilmoittautuneista.
 * Käy läpi ilmoittautumiset ja parittaa "Ei neluriparia" -rastittaneet satunnaisesti.
 */
function pairUpLonePlayers(registrations) {
    // Suodatetaan pelaajat, jotka haluavat pelata 4PLAY-sarjaa, mutta joilla ei ole vielä paria
    let lonePlayers = registrations.filter(r => 
        r.doubles.wants_to_play === true && 
        r.doubles.has_partner === false && 
        (!r.doubles.partner_name || r.doubles.partner_name.trim() === "")
    );

    // Sekoitetaan lista satunnaisuuden takaamiseksi
    lonePlayers = shuffleArray(lonePlayers);

    const formedTeams = [];
    const updatedRegistrations = [...registrations];

    while (lonePlayers.length >= 2) {
        const p1 = lonePlayers.pop();
        const p2 = lonePlayers.pop();

        const teamName = `${p1.name} / ${p2.name}`;
        
        formedTeams.push({
            team_name: teamName,
            player1_id: p1.user_id,
            player2_id: p2.user_id
        });

        // Päivitetään alkuperäisiin ilmoittautumistietoihin kumppanuus linkitystä varten
        const reg1 = updatedRegistrations.find(r => r.user_id === p1.user_id);
        const reg2 = updatedRegistrations.find(r => r.user_id === p2.user_id);
        if (reg1) { reg1.doubles.partner_name = p2.name; reg1.doubles.has_partner = true; }
        if (reg2) { reg2.doubles.partner_name = p1.name; reg2.doubles.has_partner = true; }
    }

    // Jos joku jää yli
    if (lonePlayers.length === 1) {
        console.warn(`HUOMIO: Pelaaja ${lonePlayers[0].name} jäi ilman paria nelinpeliin!`);
    }

    return { formedTeams, updatedRegistrations };
}

/**
 * TOIMINTO: Kerää kaikki valmiit nelinpelitiimit (sekä valmiit parit että järjestelmän luomat).
 */
function gatherAllDoublesTeams(registrations) {
    const teams = new Set();
    
    registrations.forEach(r => {
        if (r.doubles.wants_to_play && r.doubles.partner_name) {
            // Luodaan aakkosjärjestyksessä oleva tunniste, jotta "A / B" ja "B / A" tunnistetaan samaksi tiimiksi
            const names = [r.name.trim(), r.doubles.partner_name.trim()].sort();
            teams.add(`${names[0]} / ${names[1]}`);
        }
    });

    return Array.from(teams);
}

/**
 * TOIMINTO: Lohkojen generointi satunnaisesti
 * Jakosääntö taulukon pohjalta: jaetaan osallistujat lohkoihin (esim. max 6-8 pelaajaa/tiimiä per lohko)
 */
function generatePools(participants, maxPoolSize = 7) {
    // Sekoitetaan osallistujat täysin satunnaisesti ennen lohkoihin jakoa
    const shuffled = shuffleArray(participants);
    const pools = [];

    // Lasketaan montako lohkoa tarvitaan, jotta koko jakautuu tasaisesti
    const totalParticipants = shuffled.length;
    if (totalParticipants === 0) return pools;

    const numberOfPools = Math.ceil(totalParticipants / maxPoolSize);
    
    // Alustetaan tyhjät lohkot
    for (let i = 0; i < numberOfPools; i++) {
        pools.push([]);
    }

    // Jaetaan pelaajat vuorotellen lohkoihin (Käärme- / Round Robin -tyylinen jako tasaisuuden vuoksi)
    shuffled.forEach((participant, index) => {
        const poolIndex = index % numberOfPools;
        pools[poolIndex].push(participant);
    });

    return pools;
}

/**
 * TOIMINTO: Alkulohkojen otteluohjelman luonti (Round Robin)
 * Järjestää lohkon sisäiset ottelut niin, että kaikki pelaavat kerran toisiaan vastaan.
 */
function generateRoundRobinMatches(poolParticipants, categoryName, poolNumber) {
    let pool = [...poolParticipants];
    let n = pool.length;
    const matches = [];

    if (n < 2) return matches;

    // Jos osallistujamäärä on pariton, lisätään "lepovuoro" (null), jotta algoritmi toimii pyörityksessä
    let hasGhost = false;
    if (n % 2 !== 0) {
        pool.push(null);
        n++;
        hasGhost = true;
    }

    const rounds = n - 1;
    const matchesPerRound = n / 2;

    for (let round = 0; round < rounds; round++) {
        for (let i = 0; i < matchesPerRound; i++) {
            const home = pool[i];
            const away = pool[n - 1 - i];

            // Ei luoda ottelua jos kyseessä on lepovuoro (ghost-pelaaja)
            if (home !== null && away !== null) {
                matches.push({
                    category: categoryName,
                    pool: `LOHKO ${poolNumber}`,
                    stage: "pool",
                    team_a: home,
                    team_b: away,
                    score_a: null,
                    score_b: null,
                    court: null,     // Admin määrittää tai otteluohjelma jakaa myöhemmin
                    time_slot: null  // Admin määrittää tai otteluohjelma jakaa myöhemmin
                });
            }
        }
        // Pyöräytetään taulukkoa (ensimmäinen alkio pysyy paikallaan, muut siirtyvät askeleen)
        pool.splice(1, 0, pool.pop());
    }

    return matches;
}

/**
 * PÄÄTOIMINTO: Koko turnauskaavion generointi ilmoittautumisten pohjalta.
 */
function createEntireTournamentSchedule(registrations) {
    // 1. Erotellaan singelipelaajat sarjoittain
    const kilpaPlayers = registrations.filter(r => r.singles.wants_to_play && r.singles.level === "kilpa").map(r => r.name);
    const harrastePlayers = registrations.filter(r => r.singles.wants_to_play && r.singles.level === "harraste").map(r => r.name);
    const hupiPlayers = registrations.filter(r => r.singles.wants_to_play && r.singles.level === "hupi").map(r => r.name);

    // 2. Paritetaan nelinpeliä varten parittomat ja kerätään kaikki nelinpelitiimit
    const pairingResult = pairUpLonePlayers(registrations);
    const allDoublesTeams = gatherAllDoublesTeams(pairingResult.updatedRegistrations);

    // Koostetaan kaikki sarjat ja niiden maksimilohkokoot Excelin mukaisesti (esim. Kilpa 7, Harraste 7, Nelinpeli 5)
    const categories = [
        { name: "KILPA", players: kilpaPlayers, max_size: 7 },
        { name: "HARRASTE", players: harrastePlayers, max_size: 8 },
        { name: "HUPI", players: hupiPlayers, max_size: 5 },
        { name: "4PLAY", players: allDoublesTeams, max_size: 5 }
    ];

    const tournamentData = {
        categories: {},
        all_matches: []
    };

    // 3. Generoidaan lohkot ja ottelut jokaiselle kategorialle
    categories.forEach(cat => {
        const pools = generatePools(cat.players, cat.max_size);
        tournamentData.categories[cat.name] = pools;

        pools.forEach((poolParticipants, index) => {
            const poolMatches = generateRoundRobinMatches(poolParticipants, cat.name, index + 1);
            tournamentData.all_matches.push(...poolMatches);
        });
    });

    return tournamentData;
}


// --- 3. ESIMERKKIDATA JA TESTAUS ---

// Luodaan testisetti ilmoittautuneista pelaajista (vastaa LöScaba Excelin rakennetta)
const mockRegistrations = [
    // Pelaajia jotka pelaavat Singeliä (Kilpa) ja Neluria (Valmis pari)
    { user_id: "u1", name: "Aro Hannu", singles: { wants_to_play: true, level: "kilpa" }, doubles: { wants_to_play: true, has_partner: true, partner_name: "Aro Noel" } },
    { user_id: "u2", name: "Aro Noel", singles: { wants_to_play: false, level: "" }, doubles: { wants_to_play: true, has_partner: true, partner_name: "Aro Hannu" } },
    
    // Pelaajia Kilpa-sarjaan
    { user_id: "u3", name: "Kiljunen Jesse", singles: { wants_to_play: true, level: "kilpa" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },
    { user_id: "u4", name: "Toppila Tuomas", singles: { wants_to_play: true, level: "kilpa" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },
    { user_id: "u5", name: "Siirilä Matias", singles: { wants_to_play: true, level: "kilpa" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },
    { user_id: "u6", name: "Ketola Anton", singles: { wants_to_play: true, level: "kilpa" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },
    { user_id: "u7", name: "Saukkonen Ilmari", singles: { wants_to_play: true, level: "kilpa" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },
    { user_id: "u8", name: "Teodors", singles: { wants_to_play: true, level: "kilpa" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },
    { user_id: "u9", name: "Vena Nico", singles: { wants_to_play: true, level: "kilpa" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },
    { user_id: "u10", name: "Wilkman Jonas", singles: { wants_to_play: true, level: "kilpa" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },

    // Pelaajia Harraste-sarjaan
    { user_id: "u11", name: "Hyväri Timo", singles: { wants_to_play: true, level: "harraste" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },
    { user_id: "u12", name: "Anttila Akseli", singles: { wants_to_play: true, level: "harraste" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },
    { user_id: "u13", name: "Kiljunen Mika", singles: { wants_to_play: true, level: "harraste" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },
    { user_id: "u14", name: "Koistinen Eero", singles: { wants_to_play: true, level: "harraste" }, doubles: { wants_to_play: false, has_partner: false, partner_name: "" } },

    // Pelaajia ilman neluriparia ("Ei neluriparia" rasti ruudussa) - Järjestelmä yhdistää nämä
    { user_id: "u15", name: "Sameli Aro", singles: { wants_to_play: false, level: "" }, doubles: { wants_to_play: true, has_partner: false, partner_name: "" } },
    { user_id: "u16", name: "Luca Aro", singles: { wants_to_play: true, level: "hupi" }, doubles: { wants_to_play: true, has_partner: false, partner_name: "" } },
    { user_id: "u17", name: "Nico V.", singles: { wants_to_play: false, level: "" }, doubles: { wants_to_play: true, has_partner: false, partner_name: "" } },
    { user_id: "u18", name: "Jesse K.", singles: { wants_to_play: false, level: "" }, doubles: { wants_to_play: true, has_partner: false, partner_name: "" } }
];

// Suoritetaan turnauksen luonti testidatalla
console.log("--- LÖSCABA TURNAUSGENERATOR KÄYNNISTYY ---");
const finalTournament = createEntireTournamentSchedule(mockRegistrations);

// Tulostetaan generoidut lohkot
console.log("\n=== GENEROIDUT LOHKOT ===");
Object.keys(finalTournament.categories).forEach(catName => {
    console.log(`\nSarja: ${catName}`);
    finalTournament.categories[catName].forEach((pool, index) => {
        console.log(`  Lohko ${index + 1}: [ ${pool.join(", ")} ]`);
    });
});

// Tulostetaan esimerkkejä otteluista
console.log("\n=== GENEROIDUT OTTELUT (Esimerkkejä) ===");
console.log(`Yhteensä generoituja lohko-otteluita: ${finalTournament.all_matches.length}`);
// Näytetään 5 ensimmäistä peliä
finalTournament.all_matches.slice(0, 5).forEach((match, idx) => {
    console.log(`Matsi ${idx + 1}: [${match.category} - ${match.pool}] ${match.team_a} VS ${match.team_b}`);
});