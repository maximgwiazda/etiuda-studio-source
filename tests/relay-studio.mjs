/* run: wall 45 min */
/* STUDIO'S SIDE OF THE RELAY, PART BY PART (board 900, relay slice 1, step 5).
 *
 *     node tests/relay-studio.mjs        exit code is the number of failed checks, capped at 63
 *
 * Each part against the relay as the pinned engine builds it, in this process (tests/relay-lab.mjs), with a desk beside
 * Studio made of the pinned channel layer:
 *   rs1  the mirror beside each led team: a team on the relay keeps its folder at <user data>/relay/<relay team id>/, where
 *        the watch and every led-team read find it
 *   rs2  the relay's space, made by the lead's signed request; the same request under another key is refused
 *   rs3  the channel out and in: Studio's team file and edition reach a desk's mirror, the desk's file reaches Studio's
 *        mirror, live and after the desk was offline; the floors survive a restart, so an older file replayed is refused
 *   rs4  the roster's desks enrolled with the relay, and a desk taken off withdrawn, its session refused
 *   rs5  the head: the shape the desk accepts, signed, written while Studio runs, shown with the newest edition and its
 *        time and blocking nothing, and written again after five minutes or when an edition moves. Newest is the greatest
 *        rev, so an older file of the same catalog that sorts first is not the one named
 *   rs6  the relay invitation: the relay team id, its address, a token and the relay's id for it in place of the folder,
 *        read back by the desk's own reader; the token registered; the team file's copy for it serves the invited desk
 *        before it holds the key, and stays until that desk has read its wrap, offline meanwhile, and only then is let go
 *   rs7  F1 through Studio's own agreement: after the lead takes a desk off with a new key, a desk offline through the move
 *        reaches the new team file and key with no step, by the box whose public half the team file names as lead.box
 *   rs8  F2: a desk since removed keeps what it stored while trusted as its record, in the totals and never live; what it
 *        sends after the removal is no figure and no row
 *   rs8r F-kappa1: a blob a removed desk seals after its removal, under a counter below it and under one past it, is refused
 *        at the channel and never reaches the mirror; Studio says that desk is no longer on the team; what it stored
 *        while trusted stays its record; a file that desk then writes on a folder share lands in the mirror, and statsFor carries
 *        it to the statistics screen, which says it is not counted
 *   rs8s F2 on the statistics screen: the row of a desk since removed says "From a teammate since removed", in English and in
 *        Polish, as the review queue's row does; a file of such a desk Studio cannot place before
 *        the removal is said not counted
 *   rs9  nothing private leaves Studio unsealed: the relay keeps no team id, catalog word, path or name in the clear
 *   rs9k nor any of Studio's keys: its signing key, box secret, team keys, an invitation's secret, seal key and token, a desk
 *        copy's key and the passphrase are found nowhere the relay or the disk holds, and nowhere in what Studio sends
 *        (each call's headers and body, and each socket frame), beside two controls that are found
 *   rs10 Studio's one door to the network refuses any address but the relay's
 *   rs10a outside app.asar, ETIUDA_RELAY_ORIGIN set to etiuda.dev/relay-staging/v1/ sends there and refuses /relay/v1/
 *   rs10b the same value with the file inside app.asar is ignored, so only /relay/v1/ is reached
 *   rs10c a value that is not that shape (http, another host, no /v1/, an extra segment, an uppercase letter) is ignored
 *   rs10d a team made under the override names that address in its team file, and one already written keeps its own
 *   rs10e a dot-dot URL is refused at the request door and at the socket door from inside app.asar
 *   rs10f the same URL with %2e%2e is refused at both doors from inside app.asar
 *   rs10g a plain good URL is still sent from inside app.asar, and its socket opens
 *   rts1 an ordinary build holding a team a test service build made on staging's relay (Max, 2026-11-13 10:26) keeps it calmly: the
 *        sync finishes without a throw, nothing is called for that team and no door is set for it, the Desks screen says so in the
 *        copywriter's words (syncNote "elsewhere"), and the team's record otherwise, its key and its mirror are byte for byte what
 *        they were; the control, a team on the relay this build reaches, drops a stale "elsewhere"
 *   rts2 a team's relay address is set as a door at the licence service only where the service's own judge (service/licence/core.mjs
 *        doorRelayOk) takes it: a record that only resolves to the relay (a dot or dot-dot segment, the default port) is left out,
 *        since the service would refuse the whole set for it; the relay's address with and without its slash is set
 *   rsm9a the head names only editions the team's lead key signed (Grok's review 9, finding 1): a plain file at the root, one
 *        sealed under the team key and unsigned, and one signed by another key leave the head where it was, whatever rev and
 *        date they claim; a file that will not open keeps what the head named for a catalog the team still lists; CONTROLS:
 *        the lead's next edition moves the head, and a catalog whose file is gone while every file opens leaves it
 *   rsm9b a handover re-signs under the new key only editions the old lead key signed, so a plain file planted at the root
 *        before it is not signed by the new lead and not named in the head the handover writes
 *   rsm9c the doors set at the licence service never drop a team's door for another team's (finding 2): past the
 *        service's 16 a further team's door is left out and said, and the doors the service already holds stay as they were
 *   rs10t no call through that door can hang: a relay that never sends its headers, or stops after one chunk of its body, is
 *        cut at its bound (30 s plus the request's body at 32 KiB/s before the headers, 30 s of silence after them) and the
 *        call throws; a body that keeps moving, longer in all than the bound, completes with every byte; a quick answer
 *        leaves no timer behind
 *   rs11 N1: a spent invitation's copy is let go once its desk is off the team, by Studio's removal (the mirror's watch firing
 *        first) or by an epoch move nobody marked, or once it is past its end; the removed desk opens nothing the lead keeps
 *        after its removal, under its invitation's key, its own copy's key or any team key it held
 *   rs12 the shell's own triggers: the runner built as shell/main.js builds it, synced once as at launch and never again,
 *        carries an edition publishProject writes into the mirror to a desk of the team
 *   rs2u a desk's in-use.ec, written through the channel, is named by listUses on the mirror, and both watches see it
 *   rs2a a desk's catalog-answer.ec, written through the channel, is imported from the mirror as from a share
 *   rs2t a desk's stats.estat, written through the channel, is counted only under the roster's key
 *   rs2e a desk's own *.ec edit, written through the channel, is a review row read from the mirror
 *   rs2d a replayed, a misplaced and a removed desk's file are each dropped and said, and a desk the loaded roster
 *        has left off is not owed an answer that is not the record it stored while trusted
 *   rs911 before an epoch move that drops a desk, Studio catches its mirror up and waits; offline, or a catch-up
 *        that did not finish (the since list not 200, or a listed blob served as anything but 200, 404 or 410),
 *        the move goes ahead and the lead is told the statistics may leave out what the desk sent since the last catch-up.
 *        A listed blob answered 401 is judged by the fetch the channel makes after it reopens the session: that retry
 *        let through is a catch-up that finished, and the lead is not told
 *        Two of a desk's files listed, the second blob answered 503, is a catch-up that did not finish.
 *        A session reopened before the since page, so a hello and a session are among the calls, still returns
 *        Through the pinned client, which holds a desk's listed file and fetches it once the list is read: a held file
 *        answered 503 after the last page, a 503 on the second page's file of a list of more than one page, and a file
 *        the channel still holds at idle with every call answered 200, are each not a catch-up; CONTROLS: a since page
 *        answered 503 with no good page after it, and a file fetched on its own page and answered 503, are not; an
 *        ordinary whole catch-up is
 *   rs2l the shell's own landDue, driven by the window's focus, lands an answer a removed desk stored while trusted;
 *        the removal record is what makes that answer due
 *   rs911h the member-remove reply carries the catch-up sentence when that catch-up did not run
 *   rs914a a join sealed under a spent, withdrawn or expired invitation is not opened; one sealed under a live
 *        invitation still is (board 914). A spent invitation's key opens only what its own desk sends (E4, below)
 *   rs914b on a relay team a request that names no invitation, or one that is not live, is not admitted, automatic
 *        joining on or off; a request through a live invitation is, and a folder team still admits with the switch on
 *   rs914c a withdrawn invitation whose drop the relay refuses once is dropped at the next sync, so no live token remains
 *   rs4w a withdrawal the relay refuses once, after an epoch move that drops a desk, is sent again at the next sync,
 *        and that desk's hello is then refused removed
 *   rs2b the relay's space, refused once on the first signed request, is made at the next sync
 *   rsring a ring with a key written at the mirror's root rides inside the next signed team file to a desk, and a key
 *        then taken out is out of the next one
 *   s3wrap the wrap, byte for byte: the signed add carries {epoch, ct} opening to this epoch's team key, and a re-seal
 *        sends wraps as the third signed field, which replaces that one wrap; a wrap over 1 KiB is refused
 *   s3until the signed add carries the invitation's end, the same instant its life names, and the signature covers it
 *   s3move an epoch move re-seals every invitation not yet admitted and not dropped in that call, opened ones included,
 *        and an invitation past its end loses its secret
 *   s3name the person's name stays in Studio's book and off the link and the relay, and the relay's first-use time is
 *        kept after the hello
 *   s3row the Desks row says that time as the relay's word, beside the desk's own name, in English and in Polish
 *   s3cancel a Cancel whose drop names the invitation as used asks once and then moves the epoch; the page's confirm
 *        is that one ask, and a joined desk stays Remove
 *   s3link a relay invitation's link is https://etiuda.dev/join# and the same document, and the etiuda-join: text stays
 *   s3copies the invitation's two copies, through the shell's own handlers (studio:invite-make, studio:invite-copy): a relay team's
 *        default copy is the https link and the second choice the etiuda-join: text, and the desk's own inviteRead reads both as
 *        the same invitation; a folder team's copy is the text whichever is asked
 *   s3copyui the page's half: a relay team's row has Copy link and Copy as text, a folder team's keeps its one Copy, and the note
 *        after each says which was copied, in English and in Polish (the copywriter's words, byte for byte)
 *   s3shell the shell's own studio:invite-cancel (shell/main.js, driven with no window over the lab's relay): an unused invitation
 *        is dropped and the team does not move; a row the book calls used, pressed without the confirm, moves and posts nothing;
 *        with it the team moves once, the invitation has no secret and no mark, and the next sync's signed call drops it with no
 *        wrap for it
 *   s3shellused the same handler on an answer of used: it drops at once and asks once, asks again and posts nothing, and the
 *        confirm moves the team once, clears the pending mark, and the next sync seals the new key to the invitations left only;
 *        teams.json keeps the team file the move wrote, as every other team write does
 *   s3shellthrow a move that lands and then throws leaves the cancel standing: the invitation gone, its secret forgotten, and no wrap
 *        of the new key sealed to it at the next sync
 *   s3first board 933, condition 1: the cancel is marked in the book before the catch-up that comes before the move, so a used
 *        invitation's request landed by that catch-up is not admitted by the watch, the roster after the move does not name that
 *        desk, and the new key is wrapped for no one it names
 *   s922r board 922, the lead's answer, through the shell: s922refuse Refuse (studio:desk-refuse) on a request that proves a relay
 *        invitation writes "refused" at the relay, withdraws the invitation and holds its drop; s922hold once the hold is over
 *        the shell's sync sends the drop; s922down with the relay not answering the refusal stands, the lead is told the one
 *        placeholder sentence and nothing else changes; s922plain a request that names no invitation, or names one under a
 *        proof that fails, is refused as before. (The desk's side is tests/relay-e2e.mjs, re10 to re13.)
 *   s922a the watch lets in a desk that proves a relay invitation: "joined" is written at the relay, the invitation is spent and
 *        not dropped, and the desk is enrolled by the same sync
 *   s922said the page says that sentence on the Desks screen after a Refuse, in English and in Polish
 *   rsA4door board 980, A4, the relay team's standing door: posted at the licence reference by the lead's signed call while it is
 *        signed in, once, closed by an empty list once it is not, and never for a Studio that never signed in
 *   rsA4 end to end over the lab's relay: a certified desk of a person the lead admitted knocks with no invitation, its request
 *        reaches Studio's mirror (the lead's box handed to the channel), the watch lets it in with nobody acting, the answer joined
 *        reaches it at its door id, its key is enrolled and it reads the team's key; a stranger's certified desk is not let in and
 *        its request is dropped at the relay; a removed person's new desk is not let in until the lead admits that person again
 *   rsA4shell the same through the shell: not signed in, no door; signed in, its sync opens the door, its watch lets in and
 *        answers an admitted person's certified desk and drops a stranger's request
 *   s922floor a counter-floor refusal keeps the owed answer, and after a restart the next sync writes it above the floor so the desk reads it
 *   rs926a the lead's choice of the relay, where a team is first made (board 926): one handler in the shell, driven without a
 *        window over the real thread verbs, keeps the team and its key, keeps the mirror through keepRelay with the built-in
 *        address, has the signed team file written there with the relay as its channel, points the project's publish place at
 *        the mirror, and answers with no path, address or relay team id
 *   rs926b a project that has a team is not given another by a second press; a throw part way leaves nothing behind (no team, key
 *        or mirror, the project's place as it was)
 *   rs926c a desk of the team the handler made reads its team file and an edition the project published into its own place,
 *        through the lab relay, whose space the runner makes as for any kept relay team
 *   rs926e a Studio with no signing key, asked for the relay, is refused in the licence sentence and makes nothing: a grant names
 *        a key, so the relay no longer makes the key (board 935, G3; the leg was the first team making it)
 *   rs962s6g board 962 stage 6, U1: a desk on a relay team of two catalogs follows A only once B is taken off (its team file, its
 *        mirror's files, the head), and once A is taken off too the runner deletes the head and the desk holds none
 *   rs962t5 the relay's first-team cover offers a team this Studio leads as a third place; chosen, no relay sentence or trial, no
 *        relay team id or address, and the press asks studio:team-choose (board 962 stage 5, T5)
 *   rs926d the page: where a team is first made the lead is asked, the relay by default and a shared folder as it was; an
 *        existing team's cover asks nothing; no screen shows the mirror's path, the address or the relay team id
 *   rs926f a press whose thread reply is lost after its writes landed (the team file written, the project's place pointed at it)
 *        is taken back whole, with no team, key, mirror or file left and the project's place and mark as they were, so the
 *        lead's next press makes one team whose key, file and place agree (the test architect's edit E1)
 *   rs926g the same where the store's own write fails after the thread's writes landed
 *   rs926h where the thread cannot be asked to take the writes back, nothing is forgotten: the team, its key, its mirror, its
 *        file and the project's place stay together, and a next press is refused as the project has a team
 *   rs926i a project that sealed before (the seal mark alone) is refused in the handler's frame, with nothing written: the teams
 *        file and its keys, the signing key, the relay folder, the share and the project byte for byte as they were (E2)
 *   rs926j the same for a project whose folder has a team kept for it (the kept file alone)
 *   rs926k the same for a project whose folder holds this Studio's own team file (the file alone)
 *   rsr1a R1 of the test architect's first-hour triage (2026-10-20): a project that published rev 1 and then makes a relay team through the
 *        handler has its latest edition and the ring in the mirror before the first sync, sealed as the team's are (carried from the
 *        archive, not published again); a desk invited and admitted holds rev 1, its edition and the ring, at its first catch-up
 *   rsr1b the control: a project that never published moves as before, and the admitted desk gets no catalog and no error
 *   rsr1c an edition signed by another key, or by none, is not carried, and the move is made as before
 *   rsr1d a press that fails after the edition was carried is taken back whole, the sealed edition and the ring with it
 *   rsr1e an undo after the draft id changed takes back the edition carry wrote, named from the archived catalog id, and a
 *        file already in the mirror is left as it was
 *   rsr1f an edition whose signature names the lead key and does not verify is not carried, and the move is made as before
 *   rsce1 board 962 stage 5, section 4: carryEdition into a team's place holding another catalog's file of the same name (sealed
 *        for the team, in the clear, or sealed for a team not held here) is refused in its own frame and writes nothing
 *   rsce2 the control: carryEdition over an older edition of the same catalog, sealed for the team, still writes the latest
 *   rsce3 the same through startRelayTeam: another catalog sealed for the team being made stays byte for byte, the undo included
 *   s922down, s922owed E1 of the test architect's verdict on the Studio half: with the relay not answering the refusal stands, the
 *        invitation is withdrawn at once, the answer is kept owed and the lead is told; the shell's sync writes it when the relay is
 *        reached and the hold on the drop counts from then
 *   s922unused, s922move, s922key, s922offline Q1 (Claude alpha, 2026-10-20 07:47), through the shell: a refusal of a desk whose
 *        invitation the relay reports unused moves nothing; of one it reports used (asked of the relay at the press) writes the
 *        answer, withdraws the invitation, moves nothing and asks for the one confirm of Cancel, whose press moves the team to a new
 *        key once and seals it to the invitations left and never to the refused desk's; the relay not answering and the book
 *        knowing the invitation used, the lead is told the answer is owed and asked for the same confirm
 *   s922cover the page opens Cancel's own cover on a refusal the shell says needs the confirm, and its press sends it
 *   r2pub the test architect's R2, through the shell's own studio:publish: a lead with a relay team publishes, and the moment the
 *        publish returns, before the watch, a focus or any timer, the relay holds the edition's head and the team file's ring, so a
 *        desk of the team that opens its channel then reads both
 *   rs935a the root a grant traces to is the vendor's (the pinned ROOT_PUB is Studio's embedded key) and the engine's shared vector
 *        holds through Studio's door: both grants under the vector's root, neither under the vendor's, at their end or for another lead
 *   rs935b Studio's create over the vector carries its grant and the lead's signature over the create-2 bytes, the vector's own
 *   rs935c a lead with no grant, an ended one, one for another key, one the root did not sign or a file that is no grant sends no
 *        create and makes no team; a good grant placed afterwards makes it at the next sync
 *   rs935d the same five, through the shell's own handler (studio:team-relay): refused in the licence sentence, nothing written
 *   rs935e a good grant makes the team through the handler and the shell's sync: one create carrying the grant, and the relay keeps
 *        its end and its paid, a paid licence's and a trial's
 *   rs935f the cover says the licence sentence in English and in Polish, stays open and still offers the shared folder
 *   rs934a board 934, the test architect's condition 4: Studio asks the relay for invitation states at the relay's own route,
 *        GET /t/<relay team id>/states, and reads the shape that route gives, {states: [{id, state, usedAt}]}; the lab has no
 *        stand-in for it, so the pinned route answers: a used invitation reads used with the relay's time, an unused one reads
 *        unused, and Studio's calls name no other path
 *   rs920 a removal that keeps the next key and then fails does not seal at that key and does not lock a sealed publish:
 *        no blob at the next epoch is on the relay, a desk's upload at the current epoch is taken, a sealed publish writes,
 *        and the removal retried completes at the next epoch with the same key (board 920)
 *   rs920b a stale pending-key mark is cleared when Studio reads its own team file: a team whose next epoch's file was
 *        written but whose pending mark was left, Studio reads its own team file, and a removed desk writing the old
 *        file back is refused as a rollback with the mark gone
 *   rsC2 a removal whose edition write in the mirror is refused after the team file landed, then one look of the watch: the
 *        edition is at key number 2 and the relay is handed it at epoch 2 (board 974, C2)
 *   rs923c5 a second removal of a re-admitted desk keeps the record of its second tenure: removed at epoch 2 with one key
 *        and files, then removed again at epoch 4 with another key and other files, removedOf gives the epoch-4 record,
 *        and a stale removal at epoch 3 changes nothing
 *   g2s1 board 935, G2 on Studio's side (the test architect's finding: nothing posted a later grant): a trial's team whose lead buys,
 *        the paid grant kept beside the key as the quiet check keeps it, is posted to the team's grant route at the next sync, and
 *        past the trial's end the relay's row holds the paid end, the team works, the lead's session is answered and the runner keeps
 *        the relay's word that it works
 *   g2s2 a paid team kept renewed by the quiet check (a new grant every 25 days) never turns read-only: at days 25, 50, 75 and 100,
 *        past the first grant's read-only time, it works and the lead's session is answered
 *   g2s3 a held grant later than the relay was last told is posted at the next sync, its body the grant alone, and the answer's lapse
 *        taken as where the team stands (no session or since answered meanwhile); nothing posted again while nothing is owed; a told
 *        lapse ending earlier than the held grant is owed again; a team with no record of its last grant is posted once
 *   g2s4 a post the relay refuses (bad-grant, its clock past the grant's end) changes nothing: the relay's row byte for byte, the kept
 *        grant and no lapse from it; the refusal is said where the relay's refusals are said, and the next sync posts it again
 *   rs987 board 987, a lapse never gates letting go: a paid team past its read-only time with an invitation withdrawn and a new one
 *        sends the drop in a call of its own, which the relay takes, and the add in another, which it refuses team-lapsed and Studio
 *        says in the relay's words; once renewed, the next sync registers the add and sends the drop no more
 *   rs974lt board 974, a lapsed trial's removal end to end: Studio's removeMember on a trial's team past its end, and Studio's sync
 *        takes the desk's key off at the relay while the team stays lapsed; renewed, the moved team file lands, the removed desk's hello
 *        is answered removed and the desk that stayed is answered a session
 *   g2s8 the relay's word on a session and on since's etiuda-lapse header is kept with no grant posted: a paid team past its
 *        read-only time is kept read-only with the relay's own instants
 *   g2s5 C1 on G2, Studio's side (the design note's section 9, a notice at each step): through the shell's own handlers
 *        (studio:relay-lapse, studio:relay-lapse-seen), working past the grant's end, read-only, a trial's lapse and the sweep are
 *        each handed over with the step's days and the projects' names, still due when fetched again, and once the lead dismissed
 *        it not again, nor after the next sync; the shell tells
 *        the page one is due; the Licence cover's reply and the team's Desks reply carry the step; no file of the mirror or the
 *        project is removed by any step
 *   g2s6 the page says each step with its dates, in Claudette's words whole, in English and in Polish, on the Licence cover, on the
 *        team's Desks screen and in a notice that opens once for the steps handed over and not when none are, waiting behind another
 *        open cover; where no sweep date was told, the sentence that holds it alone is left out and nothing else changes
 *   g2s7 a team working inside its grant shows nothing new: the shell lists it nowhere, and the Licence cover and the Desks screen
 *        are byte for byte as with no word of the lapse at all, with no notice
 *   g2s9 the test architect's E1: a step counts as told only once the lead closes its notice; a step fetched behind another open
 *        cover, Studio then closed, is shown at the next launch, and closing it there tells it, so a third launch shows it no more
 *   g2s10 E2 (1): after the signing key is made again, the new key's grant is posted once, refused, said as what it is (the relay
 *        renews the team only for the key it was made with), and not posted again until the held grant names another key; the old
 *        key's backup restored, its grant is posted and taken
 *   g2s11 E2 (2): the Licence cover says, after a key made again, that the licence follows the new key and a team on the relay stays
 *        with the key it was made with, in English and in Polish
 *   g2s12 the team after the sweep (Claude alpha's ruling of 2026-10-25, option (b)): a paid team swept, its lead holding no grant that
 *        covers the day, is made nothing again by any sync: no create and no grant posted, the relay holds the mark alone, the record and the
 *        lapse kept as they were, both desks still told gone
 *   g2s13 the grant renewed after the sweep: the next sync makes the space again under the same relay team id and lead key, the lead's
 *        team file and latest edition are back at the relay, and the roster as it stands is enrolled
 *   g2s14 a desk on the roster with its kept key and team file reads the team again by itself: the new key's team file, the edition
 *        published after the renewal, the team told working, and what it writes reaches Studio
 *   g2s15 a desk taken off while the team was gone is not admitted after the renewal: not enrolled, no session, nothing new read
 *   g2s16 a trial's team swept and then bought is made again as a paid team renewed is, and both its desks come back
 *   g2s17 nothing on the desks or in Studio is deleted at any step of the cycle: every file under Studio's user data folder and each
 *        desk's mirror is still there, and both team keys are kept
 *   g2s18 the page says after the deletion, in Claudette's words, in English and in Polish, that a renewal brings the team back, and the
 *        earlier steps say where a licence is renewed as she corrected it (Menu, then Settings, then Licence)
 *   g2s19 the test architect's H1: a create that makes the space again, its answer lost after the relay made it, is finished at the next
 *        sync: the roster enrolled, an invitation made while the team was gone registered, the kept desk back
 *   g2s20 another key's create on a swept id is refused swept-other-lead; the lead's own team is not marked taken, and comes back at its next sync
 *   g2s21 the page says a taken place in her words, with the renewal on the Licence cover and the notice, without it on the Desks
 *        screen, in English and in Polish
 *   g2s22 the shell hands a taken place over as its own step: due as a notice, on the Licence cover's list, on the Desks reply
 *   g2s23 his H4: a remake answered 503 unavailable is not taken, and the team comes back at the next sync
 *   g2s24 a team marked taken is asked again at a sync Check now asks for, and comes back once its place is free
 *   g2s25 a create after the sweep answered swept-other-lead (the id kept for its own lead) is the same taken place as
 *        not-enrolled: said once in Claudette's taken words, and nothing posted for the team again
 *   g2s26 a revoked answer: the sentence is said, the quiet check fetches a grant of the same end from another key (owesGrant
 *        would not post it), the relay accepts that grant, and the sentence is then gone from the cover
 *   g2s27 an empty grantKey, the replacement already on disk, and a revoked hello: that grant is posted
 *   g2s28 a revoked mark clears when the next hello is accepted
 *   g2s29 a revoked hello, then a grant post answered 403 for another reason: the second is said
 *   g2s30 while the fetch is in flight the cover says Studio is fetching
 *   g2s31 an hour of empty fetches says the licence was not found, on the cover
 *   g2s32 Check now moves that sentence back to fetching, and a check that finds nothing returns it
 *   g2s33 the test architect's hold 6: a first create refused because another key holds the id is taken, said in Claudette's
 *        first-create words, in English and in Polish, and not posted again
 *   g2s34 stands for the relay without the tombstone (before pin 9a817191): a swept id another key took is refused, said as taken
 *        in Claudette's words, and not posted again (goes when the live Worker moves)
 *   g2s35 a registered link says it is ready, and one the relay does not have yet says it is still on its way, in English and in Polish
 *   g2s36 an empty first fetch says the fetching sentence and not REVOKED_NONE
 *   g2s37 a second fetch comes within the hour and, when it finds a grant, posts it
 *   g2s38 an hour of empty fetches ends on REVOKED_NONE
 *   g2s39 Check now on a revoked team whose fetch finds nothing ends on REVOKED_NONE at once, within the hour
 *   g2s40 after the hour the automatic fetch slows to hourly, not every five minutes for good, and Check now fetches at once
 *   g2s41 a Studio restarted after REVOKED_NONE shows REVOKED_NONE at once, not "fetching" for another hour
 *   g2s42 a second revocation starts its own hour, not the first one's, and remake clears revoked tracking
 *   g2s43 after meetRevoked posts a replacement grant, the call that met revoked is made once more in the same sync
 *   g2s44 a team is never made under a grant whose signer is on the kept revoked list, and leads to fetch
 *   g2s45 cancelling an unused invitation goes through the same path as every other relay call, reaching meetRevoked
 *   g2s46 a same-end grant under another key is refused and the create probe answers 200, so the record keeps the key
 *        in force; once that key is revoked, the recovery posts the new grant and a hello is accepted
 *   rsk10 item 10 of the test architect's triage (STRANDS), on the lab relay: a team made on the relay by its lead's key on one
 *        computer; on a new one the lead makes a key and signs in first, and opens the project, whose relay team the relay keeps
 *        under the team key, so the create Studio posts under the new key and grant is refused; the team key's backup copy is
 *        then restored over the key made here, nothing is sent for the restored key until the lead signs in again, and once
 *        signed in with it the grant follows and the relay accepts the team's grant post under it: the space is the lead's again
 *
 *   rse4a E4 of relay-life-h345 (Claude alpha's ruling (c)): a desk's withdrawal at the relay after the yes is opened under its
 *        spent invitation's key, so its request leaves the lead's mirror, and the Desks pane names it neither as member nor as asking
 *   rse4b a yes racing the withdrawal: the relay refuses the set withdrawn, the desk is taken off the signed roster and another desk
 *        let in beside it is enrolled in the same sync, and the next sync owes the relay nothing
 *   rse4c Ask again after the withdrawal, on the same invitation: seen in the mirror and the pane, let in by the watch as a first
 *        ask, "joined" written, and enrolled
 *   rse4d a spent invitation's key opens its own desk's withdrawal and not another desk's request sealed under the same seal
 *   rse4e H1 of the test architect's read of 0884c23: a desk let in and enrolled whose invitation is past the relay's keep (read
 *        "used" as a withdrawn one is), its wrap unread, stays on the roster and enrolled when another desk's withdrawal is refused;
 *        only a desk whose withdrawal this Studio fetched, its request gone from the mirror, is taken off
 *   rse4f his C2, the copywriter's words of 2026-10-27: an invitation the withdrawal made live again is marked reopened in the
 *        shell's Desks reply, and its row says her sentence in place of the relay's first use, in English and in Polish; an
 *        ordinary used row keeps the relay's first use; the mark ends when the invitation is next used
 *   rse4g G1 (a) of the test architect's triage of 2026-10-27: a withdrawal the lead's channel fetches while the watch admits, before
 *        the invitation is marked spent, is still put right within two syncs: the desk off the signed roster, the other enrolled
 *   rse4h G1 (b): a withdrawal whose invitation's own end has passed in the book is still put right within two syncs, its request
 *        out of the mirror and the Desks pane
 *   rse4i H2 of the test architect's read of 4df646e: a relay that refuses withdrawn and lists a deletion for a desk that never
 *        withdrew, forged or a file it signed listed as a deletion, takes it off nothing; only the desk's own signed deletion of its own
 *        request does
 *   rse4k the store keeps only a later request record for a desk: an older or equal one is refused and the kept one stands
 *   rse4j the replay: an old genuine withdrawal served again by a lying relay after the desk asked anew, was enrolled and read its wrap,
 *        takes it off nothing; a withdrawal counts only where it supersedes the request that desk last asked with
 *   h2f N1: a second computer, mirror not yet synced, first create refused, is not marked taken as another's and is not told
 *        to remake; after restore and Check now it comes back
 *   h2g a desk withdraws while only the first computer fetched its request; on the second computer the refused enrolment
 *        is put right by the evidence rule, and no other desk is taken off
 *   h2h the reopened row on the second computer
 *   h2i the evidence rule takes the later of the store's and the roster's asked records for a desk
 *   h2j a restored key meeting a place truly held by another key says TAKEN_SAID_FIRST, not FIRST_UNREAD_SAID
 *   rs932 board 932 (6): a background sync the relay refuses is said on the Desks screen for that team, in the copywriter's
 *        sentences. team-size, an upload refused bad-signature, replay-counter or epoch (out of step), and rate each show
 *        their line; the third out-of-step look in a row shows the three-in-a-row line in its place; a success between
 *        resets the count; a later success clears the line. The shell's Desks reply carries the kind the runner kept
 *   rs932c team-count on Make a team and on Start a new team here: the stand-in answers team-count to the create,
 *        the cover says the copywriter's sentence in English and in Polish, and nothing is left on the desks or in Studio
 *   b984a board 984: a relay handover parked at step (iii) with its old key's file gone takes the old key's backup copy through
 *        the restore: the key in the key's place stays byte for byte, the old key is kept aside, sealed, beside it and recorded,
 *        and step (iii) runs at once, the team file signed by the handover and the record cleared; the Desks screen then says the
 *        handover's ending, in English and in Polish, as after the press of Hand over
 *   b984d a handover parked at step (ii) with its old key gone, restored with the relay off line (each call held, then failing):
 *        the reply comes within five seconds with the old key aside; the handover ends at the next start, the relay answering,
 *        and the Desks screen then says its ending once
 *   b984b the same parked state refuses a copy of a third key with the restore's own refusal and writes nothing, then takes the
 *        old key's copy
 *   b984c with no handover under way, the old key's copy over a key that has signed is refused as before and writes nothing
 *   b984e a handover under way at step (ii), off line, whose recorded old key file still opens: the old key's copy is refused
 *        as before and writes nothing, since no handover is waiting for it
 *   b984f the person's own path, through the page: while a handover waits for its old key, Settings' Signing key row offers the
 *        restore its line on the Desks screen names; pressed, the handover ends and the row offers it no longer
 *   rsos every lab lead key the parts make is kept by the operating system (its wrap is the OS wrap), except a
 *        passphrase file a part names on purpose: a backup copy, a restore of one, or a key kept wrapped so a wrong
 *        passphrase will not open it
 *
 * PLANTS. Each part is then taken out once, in its own source line, the check run alone in a child against the planted
 * tree, which must go red, and the file put back and its sha256 compared with the one read before. A plant that leaves its
 * check green, or a file that does not come back byte for byte, is a failure. Throwaway keys and invented words only; a
 * lab folder under scratch/ is left in place. */
process.removeAllListeners("warning");
process.on("warning", () => {});

import "./reg-stand-on.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import * as Engine from "../src/engine.mjs";
import * as K from "../src/team-store.mjs";
import { makeInvite, newSecret } from "../src/invite.mjs";
import { makeKeyFile, makePair, osFile, readKeyFile, unlockKey, openLeadBox, OS_WRAP, signCatalog } from "../src/sign.mjs";
import { newTeam, withChannel, withDesk, writeTeam, heldTeam, newEpoch, readTeam, teamPath, withRecovery, recoveryOf, withCatalog } from "../src/team.mjs";
import { readStats } from "../src/stats.mjs";
import { relayWorld, makeVault, keyPair, boxPair, agreeWith, deskProgram, settle, until, labDir, put, read, hex, sha, wait,
  placeGrant, GRANT_ROOTS, GRANT_ROOT_PUB, grantKit, deskCert } from "./relay-lab.mjs";
import { dropPlantsTree } from "./plants-tree.mjs";
import { processStart as lockProcessStart } from "../tools/machine-lock.mjs";
import { seatEnv } from "./seated.mjs";
import { licensedOpts } from "./licensed.mjs";
import { olderFolderTeam } from "./older-folder-team.mjs"; /* a team at the relay mirror is made by the fixture, not by Studio's Sealed switch, which writes no team at a folder (the folder team's removal) */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
/* One part, or several separated by commas. Empty runs every part. */
const ONLY = new Set(String(process.env.RELAY_STUDIO_ONLY || process.argv.slice(2).filter((a) => !a.startsWith("-")).join(",") || "").split(",").map((s) => s.trim()).filter(Boolean));
const PLANT_ONLY = process.env.RELAY_STUDIO_PLANT || "";
/* Plant lifts inside a leg skipped under ETIUDA_PLANTS=off, counted with the plant table's at the end. */
let liftsSkipped = 0;
const PASS = "harbour-lamp-passphrase";
const RING = { format: 1, kind: "etiuda-ring", keys: [] };
const nodeRequire = createRequire(import.meta.url);
/* The modules this step adds, asked for one by one, so a tree without them says so leg by leg rather than not at all. */
const asked = async (p) => { try { return await import(p); } catch (e) { return { missing: String(e && e.message || e) }; } };
const Relay = await asked("../src/relay.mjs");
const { deskSnapshot, removedHeld } = await asked("../src/removed.mjs");
/* The paid licence a publish through the node modules needs (a publish with none refuses): tests/licensed.mjs. */
const LIC = await licensedOpts();

/* What this process still has going: a relay runner a leg built, a channel (the shell's or a desk's) and a timer the shell
   or the channel armed. After each leg the harness reads it. Anything still going fails that leg by name, and is stopped
   here so the next leg starts with none of it. */
const liveRunners = [], liveChannels = [], liveTimers = [], shellStops = [], shellRestores = [];
let legName = "", runnerCount = 0, timerDepth = 0;
let realSetTimeout = global.setTimeout, realSetInterval = global.setInterval;
let realClearTimeout = global.clearTimeout, realClearInterval = global.clearInterval;
function untrackTimer(handle) {
  const i = liveTimers.findIndex((t) => t.handle === handle);
  if (i >= 0) liveTimers.splice(i, 1);
}
function ownTimer() {
  /* The channel's own poll is the channel record below, and its stack can name the shell that asked for the sync. Here,
     only a timer the shell armed itself (the five minute watch, the licence checks), which quit has to clear or it starts
     the runner again. */
  const stack = String(new Error().stack || "");
  if (/[/\\]channel\.cjs/.test(stack)) return false;
  return /shell[/\\]main\.js/.test(stack);
}
function armTimerTrack() {
  if (timerDepth === 0) {
    realSetTimeout = global.setTimeout; realSetInterval = global.setInterval;
    realClearTimeout = global.clearTimeout; realClearInterval = global.clearInterval;
    global.setTimeout = function (fn, ms, ...a) {
      const own = ownTimer();
      let handle;
      const wrapped = (...args) => { untrackTimer(handle); return fn(...args); };
      handle = realSetTimeout(wrapped, ms, ...a);
      if (own) liveTimers.push({ label: "timeout " + ms, handle });
      return handle;
    };
    global.setInterval = function (fn, ms, ...a) {
      const own = ownTimer();
      const handle = realSetInterval(fn, ms, ...a);
      if (own) liveTimers.push({ label: "interval " + ms, handle });
      return handle;
    };
    global.clearTimeout = function (handle) { untrackTimer(handle); return realClearTimeout(handle); };
    global.clearInterval = function (handle) { untrackTimer(handle); return realClearInterval(handle); };
  }
  timerDepth++;
}
function disarmTimerTrack() {
  if (timerDepth === 0) return;
  timerDepth--;
  if (timerDepth === 0) {
    global.setTimeout = realSetTimeout; global.setInterval = realSetInterval;
    global.clearTimeout = realClearTimeout; global.clearInterval = realClearInterval;
  }
}
function trackRunner(opts) {
  const runner = Relay.relayRunner(opts);
  runnerCount++;
  const rec = { label: "relay runner " + runnerCount, stopped: false };
  const stop = runner.stop.bind(runner);
  rec.stop = stop;
  runner.stop = (...a) => { rec.stopped = true; return stop(...a); };
  liveRunners.push(rec);
  return runner;
}
const channelApi = Engine.relayRules().channel;
const createChannel = channelApi.createChannel;
channelApi.createChannel = function (opts) {
  const ch = createChannel.apply(this, arguments);
  let team = "", rt = opts && typeof opts.rt === "string" ? opts.rt : "";
  try {
    const pin = opts && typeof opts.pin === "function" ? opts.pin() : null;
    if (pin && pin.teamId) team = String(pin.teamId);
    if (!rt && pin && pin.rt) rt = String(pin.rt);
  } catch { /* the pin is not readable at the moment the channel is made */ }
  const rec = { label: "channel" + (team ? " " + team : "") + (rt ? " " + rt : ""), running: false };
  const start = ch.start.bind(ch), stop = ch.stop.bind(ch);
  rec.stop = stop;
  ch.start = (...a) => { const r = start(...a); rec.running = true; return r; };
  ch.stop = (...a) => { rec.running = false; return stop(...a); };
  liveChannels.push(rec);
  return ch;
};
function leftovers() {
  const out = [];
  for (const r of liveRunners) if (!r.stopped) out.push(r.label);
  for (const c of liveChannels) if (c.running) out.push(c.label);
  for (const t of liveTimers) out.push(t.label);
  return out;
}
async function releaseLeftovers() {
  for (const r of liveRunners) {
    if (r.stopped) continue;
    r.stopped = true;
    try { await r.stop(); } catch { /* the runner is already down */ }
  }
  for (const c of liveChannels) {
    if (!c.running) continue;
    c.running = false;
    try { await c.stop(); } catch { /* the channel is already down */ }
  }
  for (const t of liveTimers.splice(0, liveTimers.length)) {
    try { realClearInterval(t.handle); } catch { /* already gone */ }
    try { realClearTimeout(t.handle); } catch { /* already gone */ }
  }
  while (shellRestores.length) {
    const fn = shellRestores.pop();
    try { fn(); } catch { /* already restored */ }
  }
}

/* THE RELAY MAKES A TEAM ONLY UNDER A GRANT (board 935, slice G3). Every leg that makes a team on the relay places one for its lead
   first, through this: the lab's invented root signs it over the lead's public half and it sits beside the key file, where Studio
   reads relay-grant.json. A runner a leg builds is told the lab's root (GRANT_ROOTS) and a shell it loads STUDIO_RELAY_ROOT. */
const granted = (keyAt, pub, now, o) => placeGrant(keyAt, pub, now, o);

let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}

/* A Studio leading one team on the relay: its key file, teams file, vault, team key at epoch 1, the team file written into
   the mirror with the relay channel, and its runner over the lab's relay. `o.roster` desks are on the roster, each with a
   wrap of the key where `o.wraps`. */
async function studioLead(world, lab, o) {
  const x = o || {};
  const ud = path.join(lab, "studio-ud");
  fs.mkdirSync(ud, { recursive: true });
  const keyAt = path.join(ud, "studio-key.json");
  const lead = await labLeadKey();
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  /* `o.noGrant` leaves the lead without one, and `o.grantOpts` (the kit's grantFor options) makes it as a leg wants it. */
  const grant = x.noGrant ? null : granted(keyAt, lead.public, undefined, x.grantOpts);
  const teamsFile = K.teamsFile(ud), vault = makeVault();
  const rt = Relay.relayId(), teamId = "t-" + hex(8), teamKey = crypto.randomBytes(32);
  K.keepTeamKey(teamsFile, vault, teamId, 1, teamKey);
  const mirror = K.keepRelay(teamsFile, teamId, rt, Relay.RELAY_URL);
  let team = newTeam({ id: teamId, catalogs: ["harbour-lamps"], lead: { keyId: lead.keyId, public: lead.public }, sealed: true, exportsSealed: true });
  for (const d of x.roster || []) {
    team = withDesk(team, { id: d.keyId, key: d.pub, box: d.box.pub });
    if (x.wraps) team.roster.find((e) => e.desk.id === d.keyId).wrap = Engine.hpkeRules().wrapTeamKey(teamKey, d.box.pub, teamId, 1, d.keyId);
  }
  team = withChannel(team, { kind: "relay", rt, url: Relay.RELAY_URL }, RING);
  fs.mkdirSync(mirror, { recursive: true });
  const written = (await writeTeam(mirror, team, { key: keyAt, passphrase: labSecret(keyAt) })).team;
  const t = world.transport("studio");
  let now = null;
  /* `o.runner` adds what a leg's runner must be handed (a fetch of a new grant, the revoked keys). It does not replace the transport. */
  const runner = trackRunner(Object.assign({ roots: GRANT_ROOTS, teamsFile, vault, keyFile: keyAt, secret: () => labSecret(keyAt), request: t.request, connect: t.connect,
    watch: false, pollMs: 1e9, clock: () => (now == null ? Date.now() : now), say: (l) => { if (typeof x.say === "function") x.say(l); } }, x.runner || {}));
  return { ud, keyAt, lead, grant, teamsFile, vault, rt, teamId, teamKey, mirror, t, runner, team: written,
    setClock: (v) => { now = v; }, chan: () => runner.channel(teamId) };
}
const pinOf = (s) => ({ teamId: s.teamId, rt: s.rt, lead: { keyId: s.lead.keyId, public: s.lead.public } });
/* A desk of the team: its keys, its box, its key by epoch, and its onTeam taking the key from its own wrap, as heedTeam does. */
function deskOf(world, lab, s, name, who, held, more) {
  return deskProgram(world, lab, name, who, { channel: Object.assign({ rt: s.rt, url: Relay.RELAY_URL, pin: () => pinOf(s),
    keyFor: (e) => held.get(e) || null, sealEpoch: () => (held.size ? Math.max(...held.keys()) : null), agree: agreeWith(who.box),
    onTeam: () => {
      let doc = null;
      try { doc = JSON.parse(read(path.join(lab, name), world.C.TEAM_NAME)); } catch { return; }
      const mine = (doc.roster || []).find((e) => e && e.desk && e.desk.id === who.keyId);
      const key = mine ? Engine.hpkeRules().unwrapTeamKey(who.box.priv, mine.wrap, s.teamId, doc.epoch, who.keyId) : null;
      if (key) held.set(doc.epoch, key);
    } }, more || {}) });
}
const deskKeys = () => Object.assign(keyPair(true), { box: boxPair() });
/* A token hello as a desk sends it since relay slice 3: it binds a key of the desk's own, signed, or the relay refuses it and
   spends nothing; and since the seat wall (engine fold 119, the design note's C-4) it carries that key's seat certificate, or the relay
   refuses it seat-lapsed and spends nothing. */
function boundToken(world, rt, challenge, inv, token) {
  const k = keyPair(true);
  return { challenge, inv, invite: token, key: k.keyId, pub: k.pub,
    sig: crypto.sign(null, world.C.helloBytes(rt, challenge, k.keyId), k.privateKey).toString("hex"), seat: deskCert(k.pub) };
}
const ED_SPKI = Buffer.from("302a300506032b6570032100", "hex");
/* An answer under the team key as a desk writes it since board 962's stage 0b: signed by the desk over the ask and the team. */
function signedAnswer(D, askId, teamId, sha, catalog) {
  const doc = { format: 1, kind: "etiuda-catalog-answer", ask: String(askId), team: String(teamId), sha256: sha, catalog,
    sig: { alg: "Ed25519", keyId: D.keyId } };
  doc.sig.value = crypto.sign(null, Engine.answerLeadRules().answerLeadSignedBytes(doc), D.privateKey).toString("hex");
  return doc;
}
/* The invites posts a transport recorded, each body parsed. The wrap's own open, from the plan's bytes, not from Studio's. */
function invitePosts(t) {
  const out = [];
  for (const s of t.sent) {
    if (s.indexOf("POST ") !== 0 || s.indexOf("/invites") < 0) continue;
    const at = s.lastIndexOf("\n{");
    if (at < 0) continue;
    try { out.push(JSON.parse(s.slice(at + 1))); } catch { out.push(null); }
  }
  return out;
}
function leadVerifies(pubHex, bytes, sigHex) {
  try {
    const key = crypto.createPublicKey({ key: Buffer.concat([ED_SPKI, Buffer.from(String(pubHex), "hex")]), format: "der", type: "spki" });
    return crypto.verify(null, bytes, key, Buffer.from(String(sigHex), "hex"));
  } catch { return false; }
}
function wrapAdOf(rt, teamId, invitationId, epoch) {
  return Buffer.from("etiuda-invite-wrap\n" + rt + "\n" + teamId + "\n" + invitationId + "\n" + epoch + "\n", "utf8");
}
function wrapKeyOf(secret) {
  if (typeof secret !== "string" || !/^[0-9a-f]{32}$/.test(secret)) return null;
  return Buffer.from(crypto.hkdfSync("sha256", Buffer.from(secret, "hex"), Buffer.alloc(0), Buffer.from("etiuda-invite-wrap", "utf8"), 32));
}
function openSpec(secret, rt, teamId, invitationId, wrap) {
  if (!wrap || typeof wrap !== "object" || !Number.isSafeInteger(wrap.epoch)) return null;
  const key = wrapKeyOf(secret);
  if (!key || typeof wrap.ct !== "string" || !/^[0-9a-f]+$/.test(wrap.ct) || wrap.ct.length % 2 !== 0) return null;
  const raw = Buffer.from(wrap.ct, "hex");
  if (raw.length < 28) return null;
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
    d.setAAD(wrapAdOf(rt, teamId, invitationId, wrap.epoch));
    d.setAuthTag(raw.subarray(raw.length - 16));
    const parsed = JSON.parse(Buffer.concat([d.update(raw.subarray(12, raw.length - 16)), d.final()]).toString("utf8"));
    if (!parsed || parsed.epoch !== wrap.epoch || typeof parsed.key !== "string") return null;
    return { epoch: parsed.epoch, key: parsed.key };
  } catch { return null; }
}
function sealSpec(secret, rt, teamId, invitationId, epoch, teamKey) {
  const key = wrapKeyOf(secret);
  const plain = Buffer.from(JSON.stringify({ epoch, key: Buffer.from(teamKey).toString("hex") }), "utf8");
  const nonce = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, nonce);
  c.setAAD(wrapAdOf(rt, teamId, invitationId, epoch));
  return { epoch, ct: Buffer.concat([nonce, c.update(plain), c.final(), c.getAuthTag()]).toString("hex") };
}
const said = (lines, reason, B) => lines.filter((l) => l.indexOf(B.REASONS[reason]) >= 0).length;
/* A genuine request to join `teamId`. `invite` ({id, secret}) is carried where the request names one. */
function joinRequest(teamId, who, invite) {
  const J = Engine.joinRules(), I = Engine.inviteRules();
  const nonce = hex(32), commit = J.joinCommit(teamId, who.pub, who.box.pub, nonce);
  const req = { format: 1, kind: J.JOIN_KIND, team: teamId, desk: { id: who.keyId, key: who.pub, box: who.box.pub, name: "Quay Desk" },
    date: new Date().toISOString(), commit };
  if (invite) req.invite = { id: invite.id, proof: I.memberProof(invite.secret, commit) };
  req.sig = { alg: "Ed25519", keyId: who.keyId };
  req.sig.value = crypto.sign(null, J.joinSignedBytes(req), who.privateKey).toString("hex");
  return req;
}

/* ---- the legs -------------------------------------------------------------------------------------------------------- */
const LEGS = {};

LEGS.rs1 = async () => {
  const lab = labDir("relay-rs1"), ud = path.join(lab, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const file = K.teamsFile(ud), rt = Relay.relayId(), team = "t-" + hex(8);
  const at = K.keepRelay(file, team, rt, Relay.RELAY_URL);
  const watched = K.watchedTeams(file).find((w) => w.team === team);
  const listed = K.relayTeams(file).find((w) => w.team === team);
  const kept = K.keptTeam(file, team);
  const want = path.join(ud, "relay", rt);
  check(at === want && !!watched && watched.folder === want && !!listed && listed.folder === want && kept.relay && kept.relay.rt === rt
    && kept.folder === want,
    "rs1 a team on the relay keeps its folder at the mirror beside the team, <user data>/relay/<relay team id>/, where the watch and every"
    + " led-team read find it: folder " + (kept.folder === want ? "the mirror" : kept.folder) + ", watched " + (watched ? watched.folder === want : "no"));
};

LEGS.rs2 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs2");
  const s = await studioLead(world, lab);
  await s.runner.sync(); await s.runner.idle();
  const kept = world.store(s.rt) && world.store(s.rt).get("team");
  const other = keyPair(false, "studio-0123456789abcdef");
  const t = world.R.clock.now;
  /* Under a grant of its own, valid for that other key, so the refusal is the space's being taken and not a missing grant. */
  const forged = await world.admin("POST", "/relay/v1/teams", grantKit.createBody(s.rt, { keyId: other.keyId, pub: other.pub }, t,
    (bytes) => crypto.sign(null, bytes, other.privateKey).toString("hex")));
  const rec = K.relayTeams(s.teamsFile)[0];
  const ch = s.chan();
  check(!!kept && kept.lead.pub === s.lead.public && kept.lead.keyId === s.lead.keyId && rec.created === true && forged.status !== 200
    && !!ch && ch.online(),
    "rs2 the relay's space is made by the lead's signed request, Studio's channel opens its session by the lead's key, and the same space"
    + " asked for under another key is refused: space " + (kept ? "made under the lead's key" : "missing") + ", another key "
    + forged.status + " " + (forged.json && forged.json.error) + ", session " + (ch && ch.online() ? "open" : "none"));
  await s.runner.stop();
};

LEGS.rs3 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs3");
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true });
  await s.runner.sync(); await s.runner.idle();
  const EDITION = "{\"kind\":\"etiuda-sealed\",\"note\":\"Harbour lamps, edition one, a sealed text\"}\n";
  put(s.mirror, "harbour-lamps.ec", EDITION);
  await s.runner.sync(); await s.runner.idle();
  const held = new Map([[1, s.teamKey]]);
  const desk = deskOf(world, lab, s, "desk", D, held);
  desk.ch.start();
  await settle(desk.ch);
  const inbound = read(desk.mirror, "harbour-lamps.ec") === EDITION && read(desk.mirror, world.C.TEAM_NAME) === read(s.mirror, world.C.TEAM_NAME);
  /* The desk's own file back to Studio, live; then offline: Studio's next edition waits, and arrives once it answers. */
  put(desk.mirror, "desks/" + D.keyId + "/in-use.ec", "{\"inUse\":\"harbour-lamps one\"}\n");
  await settle(desk.ch);
  await s.runner.sync(); await s.runner.idle();
  const back = read(s.mirror, "desks/" + D.keyId + "/in-use.ec") === "{\"inUse\":\"harbour-lamps one\"}\n";
  desk.t.down = true;
  put(s.mirror, "harbour-lamps.ec", EDITION.replace("one", "two"));
  await s.runner.sync(); await s.runner.idle();
  await settle(desk.ch);
  const whileDown = read(desk.mirror, "harbour-lamps.ec") === EDITION;
  desk.t.down = false;
  await settle(desk.ch);
  const caught = read(desk.mirror, "harbour-lamps.ec") === EDITION.replace("one", "two");
  /* A restart: the floors are read back from the record beside the mirror, and an older copy of the desk's file replayed
     by the relay is refused. */
  const deskBlobs = world.blobsBy(s.rt, D.keyId).filter((b) => !b.del);
  const stash = world.recordOf(s.rt, deskBlobs[0].id);
  put(desk.mirror, "desks/" + D.keyId + "/in-use.ec", "{\"inUse\":\"harbour-lamps two\"}\n");
  await settle(desk.ch);
  await s.runner.sync(); await s.runner.idle();
  await s.runner.stop();
  const lines = [];
  const again2 = trackRunner({ roots: GRANT_ROOTS, teamsFile: s.teamsFile, vault: s.vault, keyFile: s.keyAt, secret: () => labSecret(s.keyAt), request: s.t.request,
    connect: s.t.connect, watch: false, pollMs: 1e9, say: (l) => lines.push(l) });
  await again2.sync();
  const seqAfter = again2.channel(s.teamId).program.state().seq;
  await again2.idle();
  world.store(s.rt).del("tomb:" + stash.rec.id);
  world.inject(s.rt, Object.assign({}, stash.rec), stash.ct);
  await again2.sync(); await again2.idle();
  const kept = read(s.mirror, "desks/" + D.keyId + "/in-use.ec") === "{\"inUse\":\"harbour-lamps two\"}\n";
  check(inbound && back && whileDown && caught && seqAfter > 0 && kept && said(lines, "replay-counter", world.B) >= 1,
    "rs3 the channel runs in Studio both ways: Studio's team file and edition reach the desk's mirror whole " + inbound + ", the desk's file"
    + " reaches Studio's " + back + ", an edition published while the desk is offline waits " + whileDown + " and arrives after " + caught
    + "; after a restart the record beside the mirror holds its place (seq " + seqAfter + ") and an older file replayed is refused"
    + " (replay-counter said " + said(lines, "replay-counter", world.B) + ", newer kept " + kept + ")");
  await again2.stop(); await desk.ch.stop();
};

LEGS.rs4 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs4");
  const D = deskKeys(), G = deskKeys();
  const s = await studioLead(world, lab, { roster: [D, G], wraps: true });
  await s.runner.sync(); await s.runner.idle();
  const both = !!world.store(s.rt).get("dev:" + D.keyId) && !!world.store(s.rt).get("dev:" + G.keyId);
  const gone = deskOf(world, lab, s, "gone", G, new Map([[1, s.teamKey]]));
  gone.ch.start(); await settle(gone.ch);
  const before = gone.ch.online();
  /* G taken off: a roster without it, written by the lead. */
  const h = await heldTeam(s.mirror, { key: s.keyAt });
  const next = await newEpoch(h.team, { key: s.keyAt, remove: G.keyId, secret: labSecret(s.keyAt) });
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, 2, next.teamKey);
  await writeTeam(s.mirror, next.team, { key: s.keyAt, passphrase: labSecret(s.keyAt) });
  await s.runner.sync(); await s.runner.idle();
  const withdrawn = !!world.store(s.rt).get("gone:" + G.keyId) && !world.store(s.rt).get("dev:" + G.keyId) && !!world.store(s.rt).get("dev:" + D.keyId);
  const t = world.transport("gone-hello");
  const ch = JSON.parse((await t.request("POST", Relay.RELAY_URL + "/t/" + s.rt + "/hello", {}, Buffer.from("{}"))).bytes.toString()).challenge;
  const ses = await t.request("POST", Relay.RELAY_URL + "/t/" + s.rt + "/session", { "content-type": "application/json" },
    Buffer.from(JSON.stringify({ challenge: ch, key: G.keyId, pub: G.pub, sig: crypto.sign(null, world.C.helloBytes(s.rt, ch, G.keyId), G.privateKey).toString("hex") })));
  const refusedNow = JSON.parse(ses.bytes.toString()).error;
  check(both && before && withdrawn && refusedNow === "removed",
    "rs4 the roster's desks are enrolled with the relay by the lead's signed list, and a desk taken off is withdrawn by being left out of the"
    + " next: enrolled " + both + ", its session before " + before + ", withdrawn " + withdrawn + ", its hello now " + refusedNow);
  await s.runner.stop(); await gone.ch.stop();
};

LEGS.rs5 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs5");
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true });
  const first = "2026-10-18", next = "2026-10-18a", older = "2026-10-17";
  /* Two files of the one led catalog, the older rev in the file that sorts first. The head names the greatest rev. Each signed by the
     lead's key, as a publish signs it: since review 9 the head names no edition that key did not sign (rsm9a). */
  const open = unlockKey(readKeyFile(s.keyAt), labSecret(s.keyAt));
  const lead = async (doc) => JSON.stringify(await signCatalog(doc, { privateKey: open.privateKey, keyId: open.keyId })) + "\n";
  put(s.mirror, "a-harbour.ec", await lead({ id: "harbour-lamps", rev: 1, date: older }));
  put(s.mirror, "harbour-lamps.ec", await lead({ id: "harbour-lamps", rev: 2, date: first }));
  const t0 = Date.now();
  s.setClock(t0);
  await s.runner.sync(); await s.runner.idle();
  const desk = deskOf(world, lab, s, "desk", D, new Map([[1, s.teamKey]]));
  desk.ch.start(); await settle(desk.ch);
  let head = null;
  try { head = JSON.parse(read(desk.mirror, Relay.HEAD_NAME)); } catch { head = null; }
  const news = desk.prog.headNews(t0 + 60000);
  const entry = head && Array.isArray(head.editions) ? head.editions[0] : null;
  s.setClock(t0 + 60000);
  await s.runner.sync();
  let same = false;
  try { same = JSON.parse(read(s.mirror, Relay.HEAD_NAME)).t === t0; } catch { same = false; }
  put(s.mirror, "harbour-lamps.ec", await lead({ id: "harbour-lamps", rev: 3, date: next }));
  s.setClock(t0 + 61000);
  await s.runner.sync(); await s.runner.idle();
  await settle(desk.ch);
  let movedHead = null, movedNews = null;
  try { movedHead = JSON.parse(read(s.mirror, Relay.HEAD_NAME)); } catch { movedHead = null; }
  try { movedNews = desk.prog.headNews(t0 + 61000); } catch { movedNews = null; }
  s.setClock(t0 + 61000 + Relay.HEAD_MS);
  await s.runner.sync();
  let aged = false;
  try { aged = JSON.parse(read(s.mirror, Relay.HEAD_NAME)).t === t0 + 61000 + Relay.HEAD_MS; } catch { aged = false; }
  const shaped = !!head && head.v === 1 && head.team === s.teamId && head.t === t0 && head.epoch === 1 && head.rev === s.team.rev
    && !!entry && entry.catalog === "harbour-lamps" && entry.rev === 2 && entry.edition === first && entry.published === first
    && !!news && news.shown === true && news.blocked === false && news.edition === first && news.published === first
    && news.time === t0 && news.ageMs === 60000 && news.rev === s.team.rev && news.epoch === 1;
  const moved = !!movedHead && movedHead.t === t0 + 61000 && !!movedNews && movedNews.shown === true && movedNews.blocked === false
    && movedNews.edition === next && movedNews.published === next;
  check(shaped && same && moved && aged,
    "rs5 the head is the shape the desk accepts and reaches it, which shows the newest edition and its time and blocks nothing (shown "
    + (news ? news.shown : false) + ", blocked " + (news ? news.blocked : null) + ", edition " + (news ? news.edition : "none")
    + ", published " + (news ? news.published : "none") + ", age " + (news ? news.ageMs : null) + " ms); it is not rewritten within five minutes "
    + same + ", is when an edition moves " + moved + ", and is after five minutes " + aged);
  await s.runner.stop(); await desk.ch.stop();
};

LEGS.rs6 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs6");
  const s = await studioLead(world, lab);
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const target = { team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } };
  const made = makeInvite(target, "Ada Quay", secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  const back = Engine.inviteRules().inviteRead(made.blob, false);
  K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  await s.runner.sync(); await s.runner.idle();
  /* The pinned reader (from engine fold 131) answers an invitation with no folder field at all; it answered folder "" before, so the check
     held `back.folder === ""`. What it holds is the same, that no folder is named: the field is absent here and in the blob below. */
  const readBack = !!back && back.folder === undefined && !!back.relay && back.relay.rt === s.rt && back.relay.url === Relay.RELAY_URL
    && back.relay.token === ri.token && back.relay.inv === ri.inv && JSON.parse(Buffer.from(made.blob.slice(12), "base64url").toString()).folder === undefined;
  const registered = !!world.store(s.rt).get("inv:" + ri.inv);
  /* The invited desk: its one session by the token, the team file read under the invitation's key before it holds the team
     key, its request sealed under the same key. */
  const N = deskKeys(), nHeld = new Map();
  const joiner = deskOf(world, lab, s, "joiner", N, nHeld, { invite: () => ({ inv: ri.inv, token: ri.token, seal: ri.seal }) });
  const J = Engine.joinRules(), I = Engine.inviteRules();
  const nonce = hex(32), commit = J.joinCommit(s.teamId, N.pub, N.box.pub, nonce);
  const req = { format: 1, kind: J.JOIN_KIND, team: s.teamId, desk: { id: N.keyId, key: N.pub, box: N.box.pub, name: "Desk Nine" },
    date: new Date().toISOString(), commit, invite: { id: I.inviteIdOf(secret), proof: I.memberProof(secret, commit),
 } };
  req.sig = { alg: "Ed25519", keyId: N.keyId };
  req.sig.value = crypto.sign(null, J.joinSignedBytes(req), N.privateKey).toString("hex");
  put(joiner.mirror, "desks/" + N.keyId + "/join.json", JSON.stringify(req, null, 1) + "\n");
  joiner.ch.start(); await settle(joiner.ch);
  await s.runner.sync(); await s.runner.idle();
  const first = read(joiner.mirror, world.C.TEAM_NAME) === read(s.mirror, world.C.TEAM_NAME);
  const asked = !!read(s.mirror, "desks/" + N.keyId + "/join.json");
  /* The lead admits it, as Studio's watch does, and ends the invitation as spent; the desk is offline meanwhile. */
  joiner.t.down = true;
  const S = await import("../src/studio.mjs");
  const r = await S.watchAdmit(s.mirror, s.keyAt, labSecret(s.keyAt), { auto: false, teamKeys: K.teamKeysOf(s.teamsFile, s.vault),
    invites: K.inviteBookOf(s.teamsFile, s.vault), teamsFile: s.teamsFile });
  for (const x of r.spent || []) K.endInvite(s.teamsFile, s.teamId, x.invite, "spent", x.desk);
  await s.runner.sync(); await s.runner.idle();
  await s.runner.sync(); await s.runner.idle();
  const stillLive = K.relayInvitesOf(s.teamsFile, s.vault, s.teamId).find((i) => i.id === made.id);
  /* Back online, the desk reads the copy that now carries its wrap, and holds the key. */
  joiner.t.down = false;
  await settle(joiner.ch);
  const wrapped = nHeld.has(1);
  /* It deletes its request once it holds the key, as the desk's joinView does; then the invitation is let go. */
  fs.unlinkSync(path.join(joiner.mirror, "desks", N.keyId, "join.json"));
  await settle(joiner.ch);
  await s.runner.sync(); await s.runner.idle();
  await s.runner.sync(); await s.runner.idle();
  const after = K.relayInvitesOf(s.teamsFile, s.vault, s.teamId).find((i) => i.id === made.id);
  const copies = world.entries(s.rt).filter(([k, v]) => k.startsWith("blob:") && v.place === "invite:" + ri.inv);
  /* Dropped: since the engine's F9 the relay keeps of a spent invitation only that it was spent, so its token stays refused. */
  const kept = world.store(s.rt).get("inv:" + ri.inv);
  const dropped = !kept || (kept.spent === true && Object.keys(kept).length === 1);
  check(readBack && registered && first && asked && (r.admitted || []).length === 1 && stillLive && !stillLive.gone && wrapped
    && after && after.gone && after.dropped && copies.length === 1 && copies[0][1].del === true && dropped,
    "rs6 the relay invitation names the relay team, its address, a token and the relay's id in place of the folder, as the desk reads it "
    + readBack + "; the token is registered " + registered + "; the invited desk reads the team file and its request reaches Studio "
    + (first && asked) + "; admitted while offline, its copy stays " + !!(stillLive && !stillLive.gone) + " until it has read its wrap "
    + wrapped + ", and is then let go " + !!(after && after.gone) + ", superseded by the lead's signed deletion "
    + (copies.length === 1 && copies[0][1].del) + " and dropped on the relay " + dropped);
  await s.runner.stop(); await joiner.ch.stop();
};

LEGS.rs7 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs7");
  const D1 = deskKeys(), D2 = deskKeys();
  const s = await studioLead(world, lab, { roster: [D1, D2], wraps: true });
  await s.runner.sync(); await s.runner.idle();
  const h1 = new Map([[1, s.teamKey]]), h2 = new Map([[1, s.teamKey]]);
  const d1 = deskOf(world, lab, s, "d1", D1, h1), d2 = deskOf(world, lab, s, "d2", D2, h2);
  d1.ch.start(); d2.ch.start();
  await settle(d1.ch, d2.ch);
  /* d1 offline through the move; the lead takes d2 off with a new key, as Studio's removal does. */
  d1.t.down = true;
  await d1.ch.stop();
  const h = await heldTeam(s.mirror, { key: s.keyAt });
  const next = await newEpoch(h.team, { key: s.keyAt, remove: D2.keyId, secret: labSecret(s.keyAt) });
  await writeTeam(s.mirror, next.team, { key: s.keyAt, passphrase: labSecret(s.keyAt) });
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, 2, next.teamKey);
  put(s.mirror, "after-move.ec", "{\"kind\":\"etiuda-sealed\",\"note\":\"written after the move\"}\n");
  await s.runner.sync(); await s.runner.idle();
  await s.runner.sync(); await s.runner.idle();
  d1.t.down = false;
  const back = deskOf(world, lab, s, "d1", D1, h1);
  back.ch.start(); await settle(back.ch);
  let doc = null;
  try { doc = JSON.parse(read(back.mirror, world.C.TEAM_NAME)); } catch { doc = null; }
  const box = Relay.leadOpened(s.keyAt, labSecret(s.keyAt)).box;
  const leadBox = doc && doc.lead && doc.lead.box;
  await settle(d2.ch);
  check(!!doc && doc.epoch === 2 && h1.has(2) && h1.get(2).equals(next.teamKey) && read(back.mirror, "after-move.ec") !== null
    && back.prog.state().pending.length === 0 && leadBox === box.public && !h2.has(2) && read(d2.mirror, "after-move.ec") === null,
    "rs7 F1 through Studio's own agreement: a desk offline through the lead's move reaches the new team file and key with no step"
    + " (epoch " + (doc && doc.epoch) + ", key " + (h1.has(2) ? "held" : "absent") + ", the file after the move "
    + (read(back.mirror, "after-move.ec") !== null ? "loaded" : "missing") + ", pending " + back.prog.state().pending.length
    + "), agreeing by the box the team file names as lead.box " + (leadBox === box.public) + "; the desk taken off holds no new key "
    + !h2.has(2));
  await s.runner.stop(); await back.ch.stop(); await d2.ch.stop();
};

LEGS.rs8 = async () => {
  const lab = labDir("relay-rs8"), folder = path.join(lab, "mirror");
  const id = "k-" + hex(8), key = hex(32), rel = "desks/" + id + "/stats.estat", rel2 = "desks/" + id + "/branch.ec";
  put(folder, rel, "{\"before\":1}\n");
  const at = Date.now();
  const files = deskSnapshot(folder, id);
  const removed = { [id]: { key, at, epoch: 2, files } };
  const kept1 = removedHeld(folder, removed);
  /* Landed in the mirror before the removal by Studio's own clock, though the snapshot missed it: the layer's record places it. */
  const body = "{\"branch\":\"stored before the move\"}\n";
  put(folder, rel2, body);
  const state = { kind: "etiuda-relay-channel", v: 1, applied: { [rel2]: { writer: id, epoch: 1, counter: at - 5000, id: hex(16), at: at - 1000,
    sha: sha(Buffer.from(body, "utf8")), del: false } } };
  fs.writeFileSync(folder + ".json", JSON.stringify(state));
  const kept2 = removedHeld(folder, removed);
  /* F-kappa1: landed after the removal under a counter the desk names as before it. The counter is the desk's own word, so
     Studio cannot place the file: not counted, and named as left. */
  state.applied[rel2].at = at + 1000;
  fs.writeFileSync(folder + ".json", JSON.stringify(state));
  const left2 = [];
  const kept2b = removedHeld(folder, removed, left2);
  const leftNamed = left2.some((l) => l.desk === id && l.path === rel2);
  /* Sent after the removal: other bytes of its statistics, and a branch under a counter past the removal. */
  put(folder, rel, "{\"after\":2}\n");
  state.applied[rel2].counter = at + 5000;
  fs.writeFileSync(folder + ".json", JSON.stringify(state));
  const kept3 = removedHeld(folder, removed);
  put(folder, rel, "{\"before\":1}\n");
  /* The statistics as Studio counts them: the record in the totals, marked, never live; other bytes nothing at all. */
  const recordSha = files[rel];
  const open = () => "{\"desk\":\"" + id + "\",\"cards\":[{\"id\":\"c-lamp\",\"n\":3}],\"sync\":\"2026-10-17T09:00:00.000Z\"}";
  const live = readStats(folder, { roster: [], open, removed: { [id]: recordSha } });
  put(folder, rel, "{\"after\":2}\n");
  const afterRead = readStats(folder, { roster: [], open, removed: { [id]: recordSha } });
  check(kept1[id][rel] === recordSha && kept2[id][rel2] === sha(Buffer.from(body, "utf8")) && !kept2b[id][rel2] && leftNamed
    && !kept3[id][rel] && !kept3[id][rel2]
    && live.rows.length === 1 && live.rows[0].removed === true && live.live.n === 0 && live.quiet.length === 0
    && afterRead.rows.length === 0 && afterRead.quiet.length === 0,
    "rs8 F2: a desk since removed keeps what it stored while trusted, the files its folder held at the removal " + !!kept1[id][rel]
    + " and a file the layer landed before it by Studio's clock " + !!kept2[id][rel2] + "; a file landed after it under a counter the desk"
    + " names as before is not counted " + !kept2b[id][rel2] + " and is named as left " + leftNamed
    + "; what it sends after is not its record (" + Object.keys(kept3[id]).length
    + " counted); its statistics are a row marked removed in the totals " + (live.rows.length === 1 && live.rows[0].removed === true)
    + ", never live (live " + live.live.n + ", quiet " + live.quiet.length + "), and other bytes are nothing (" + afterRead.rows.length + " rows)");
};

/* F-kappa1 at this pin: a desk's statistics stored while trusted are its record. After the removal, a relay that keeps a
   blob anyway may serve one the removed desk sealed with the keys it still holds. The channel refuses that blob, under a
   counter below the removal and under one past it, and it never reaches the mirror. Studio says the refusal in the line
   the channel gives it. No Studio line can let the blob through, so the plant is that say line. A file the removed desk then writes on a folder
   share, straight into the mirror, is no record either: statsFor carries it in removedLeft and the statistics screen says
   it is not counted (lambda-prime's drive, carried here by the test architect's merge condition of 2026-10-19). */
LEGS.rs8r = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs8r");
  const lines = [];
  const X = deskKeys();
  const s = await studioLead(world, lab, { roster: [X], wraps: true, say: (l) => lines.push(l) });
  const sync = async () => { for (let i = 0; i < 2; i++) { await s.runner.sync(); await s.runner.idle(); } };
  await sync();
  const desk = deskOf(world, lab, s, "x", X, new Map([[1, s.teamKey]]));
  desk.ch.start(); await settle(desk.ch);
  const rel = "desks/" + X.keyId + "/stats.estat", stored = "{\"note\":\"stored while trusted\"}\n";
  put(desk.mirror, rel, stored);
  await settle(desk.ch); await sync();
  const landed = read(s.mirror, rel) === stored;
  const rec0 = JSON.parse(fs.readFileSync(s.mirror + ".json", "utf8")).applied[rel];
  await desk.ch.stop();
  /* The removal, as the shell records one: an epoch move without X, the new key kept, the removal marked with its snapshot. */
  const h = await heldTeam(s.mirror, { key: s.keyAt });
  const next = await newEpoch(h.team, { key: s.keyAt, remove: X.keyId, secret: labSecret(s.keyAt) });
  await writeTeam(s.mirror, next.team, { key: s.keyAt, passphrase: labSecret(s.keyAt) });
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, next.team.epoch, next.teamKey);
  const at = Date.now();
  K.markRemoved(s.teamsFile, s.teamId, { id: X.keyId, key: X.pub }, at, next.team.epoch, deskSnapshot(s.mirror, X.keyId));
  await sync();
  const record = (removedHeld(s.mirror, K.removedOf(s.teamsFile, s.teamId))[X.keyId] || {})[rel] === sha(Buffer.from(stored, "utf8"));
  const forge = (body, counter, at2) => {
    const b = world.B.seal({ relayTeamId: s.rt, epoch: 1, teamKey: s.teamKey, writer: { keyId: X.keyId, privateKey: X.privateKey },
      path: at2 || rel, body, counter, place: "desk:" + X.keyId, kind: "file" });
    world.inject(s.rt, { id: b.id, supersedes: null, epoch: 1, writer: X.keyId, counter: b.counter, del: false, sig: b.signature,
      nonce: b.nonce, place: "desk:" + X.keyId }, b.ciphertext);
  };
  const stayed = (body) => read(s.mirror, rel) !== body && read(s.mirror, rel) === stored;
  const saidRemoved = () => said(lines, "removed", world.B);
  const beforeForge = saidRemoved();
  await new Promise((r) => setTimeout(r, 30));
  const body2 = "{\"note\":\"sealed after the removal, under a counter below it\"}\n";
  forge(body2, rec0.counter + 1);
  await sync();
  const stayed2 = stayed(body2), said2 = saidRemoved() - beforeForge;
  const body3 = "{\"note\":\"control, a counter past the removal\"}\n";
  forge(body3, at + 120000);
  await sync();
  const stayed3 = stayed(body3), said3 = saidRemoved() - beforeForge;
  /* THE GRACE ADDS, IT NEVER REPLACES: a new path sealed before the removal reaches the lead, inside the grace. */
  const relNew = "desks/" + X.keyId + "/in-use.ec", bodyNew = "{\"note\":\"a last file on a new path, sealed before the removal\"}\n";
  forge(bodyNew, rec0.counter + 2, relNew);
  await sync();
  const reachedNew = read(s.mirror, relNew) === bodyNew;
  const still = (removedHeld(s.mirror, K.removedOf(s.teamsFile, s.teamId))[X.keyId] || {})[rel] === sha(Buffer.from(stored, "utf8"));
  /* As a desk on a folder share would: the removed desk's file written straight into the mirror after the removal. */
  const body4 = "{\"note\":\"written on a folder share after the removal\"}\n";
  put(s.mirror, rel, body4);
  /* The same mirror, through statsFor, so the screen's sentence is the one statsFor handed the painter.
     The page is given the project Studio has open: the painter reads that draft's languages. */
  const S = await import("../src/studio.mjs");
  const proj = (await S.newProject(path.join(lab, "projects"), "Harbour lamps", [{ code: "en", name: "English" }])).dir;
  S.setPublishFolder(proj, s.mirror);
  const opened = await S.openProject(proj);
  const got = await S.statsFor(proj, { key: s.keyAt, passphrase: labSecret(s.keyAt), removed: K.removedOf(s.teamsFile, s.teamId) });
  const carried = !!got && Array.isArray(got.removedLeft) && got.removedLeft.some((r) => r && r.name === rel);
  const { loadPage } = await import("./page-stand-in.mjs");
  const paintLeft = (lang) => {
    const home = loadPage({ api: {}, uiLang: lang });
    const P = home.page;
    Object.assign(P.S, { open: opened, screen: "project", section: "stats", lang, sel: null, err: null, stats: got });
    P.__get("statsViewOf").set(proj, "every");
    P.__get("paintStats")();
    return home.node("#main").innerHTML;
  };
  const enLeft = paintLeft("en"), plLeft = paintLeft("pl");
  const LEFT_EN = "is not counted: it came from a teammate since removed, and this Studio cannot show it was stored before the removal.";
  const LEFT_PL = "nie jest liczony: pochodzi od członka zespołu, którego już w nim nie ma";
  const painted = carried && enLeft.indexOf(rel) >= 0 && enLeft.indexOf(LEFT_EN) >= 0 && plLeft.indexOf(rel) >= 0 && plLeft.indexOf(LEFT_PL) >= 0;
  check(landed && rec0.counter + 1 < at && record && stayed2 && said2 >= 1 && stayed3 && said3 >= 2 && still && painted && reachedNew,
    "rs8r a removed desk's file is refused at the channel and Studio says so: stored while trusted is the record "
    + (landed && record) + " (counter below the removal " + (rec0.counter + 1 < at) + "); a blob sealed after, under a counter below the removal, stays out of the mirror "
    + stayed2 + " and Studio says the desk is no longer on the team " + (said2 >= 1) + " (" + said2 + "); the same under a counter past the removal stays out "
    + stayed3 + " and is said again " + (said3 >= 2) + " (" + said3 + "); the copy taken before the removal is still the record " + still + "; a new path sealed before the removal reaches the lead " + reachedNew
    + "; a file it then writes on a folder share is carried by statsFor to the statistics screen, which says it is not counted " + painted);
  await s.runner.stop();
};

/* F2 in the review queue: a branch a desk since removed stored while trusted is a row that says so; other bytes are none. The
   desk's file is made as tests/desk-queue.mjs makes one: the pinned engine's own projection of an edition, edited and signed
   under the desk prefix. */
LEGS.rs8q = async () => {
  const S = await import("../src/studio.mjs");
  const { ARCHIVE, CATALOG_IN_ARCHIVE, editionsIn } = await import("../src/publish.mjs");
  const lab = labDir("relay-rs8q"), share = path.join(lab, "share");
  const F = await Engine.format(), V = Engine.sigRules();
  const src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8");
  const E = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64") + "#rs8q");
  const made = await S.newProject(path.join(lab, "projects"), "Quay lamps", [{ code: "en", name: "English" }]);
  const shelf = (await S.addTag(made.dir, "shelf", { en: "General" })).tag.id;
  const card = (await S.addCard(made.dir, shelf, "Lamp hours", "The lamps are lit at dusk.")).card.id;
  await S.publishProject(made.dir, { folder: share, notes: "Edition 1.", now: "2026-10-17T09:00:00.000Z", ...LIC });
  const eds = editionsIn(made.dir);
  const from = JSON.parse(fs.readFileSync(path.join(made.dir, ARCHIVE, eds[eds.length - 1], CATALOG_IN_ARCHIVE), "utf8"));
  const pair = crypto.generateKeyPairSync("ed25519");
  const raw = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32);
  const id = "k-" + sha(raw).slice(0, 16);
  const branch = (words) => {
    const doc = JSON.parse(JSON.stringify(E.catalogToV2(E.catalogFromV2(JSON.parse(JSON.stringify(from))))));
    doc.cards.find((c) => c.id === card).body.en = words;
    doc.id = id + "-" + sha(Buffer.from(String(from.id))).slice(0, 8);
    doc.rev = 3; doc.date = "2026-10-17"; doc.modified = true;
    doc.grew = { id: String(from.id), rev: Number(from.rev), sha: "sha256:" + sha(Buffer.from(V.v2SignedBytes(from))) };
    doc.desk = { id, key: raw.toString("hex"), box: sha("box of " + id), name: "Desk Eleven" };
    delete doc.hash; delete doc.sig;
    doc.hash = F.contentHash(doc);
    doc.sig = { alg: "Ed25519", keyId: id };
    doc.sig.value = crypto.sign(null, Buffer.concat([Buffer.from("etiuda-desk-branch\n", "utf8"), Buffer.from(V.v2SignedBytes(doc))]),
      pair.privateKey).toString("hex");
    return JSON.stringify(doc, null, 1) + "\n";
  };
  const rel = "desks/" + id + "/quay-lamps.ec";
  put(share, rel, branch("The lamps are lit at dusk, and again at four."));
  const removed = { [id]: { key: raw.toString("hex"), at: Date.now(), epoch: 2, files: deskSnapshot(share, id) } };
  const rowOf = (l) => (l.proposals || []).find((p) => String(p.file).split(path.sep).join("/").endsWith(rel));
  const plain = rowOf(await S.listProposals(made.dir));
  const record = rowOf(await S.listProposals(made.dir, { removed }));
  put(share, rel, branch("Sent after the removal: the lamps are never lit."));
  const after = rowOf(await S.listProposals(made.dir, { removed }));
  check(!!plain && plain.ok && !plain.removed && !!record && record.ok && record.removed === true && !after,
    "rs8q F2 in the review queue: a desk's branch is a row " + !!(plain && plain.ok) + "; once that desk is removed, the branch it stored while"
    + " trusted is still a row and says it came from a desk since removed " + !!(record && record.removed) + ", and what it sends after is no row "
    + !after);
};

/* F2 on the statistics screen (the test architect's condition 3 of 2026-10-18; Claude alpha's choice of 10:44, the statistics
   row too): statsFor marks a desk since removed `removed: true`, and the Every answer table says so on that row, in English
   and in Polish, in the words the review queue's row uses; a roster desk's row says nothing of the kind. ui/app.js is painted
   on tests/page-stand-in.mjs, markup only. */
LEGS.rs8s = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const dir = path.join(ROOT, "scratch", "relay-rs8s-unwritten");
  const paintIn = (lang) => {
    const home = loadPage({ api: {}, uiLang: lang });
    const P = home.page;
    Object.assign(P.S, { open: { dir }, screen: "project", section: "stats", lang, sel: null, err: null, stats: { folder: dir,
      head: ["desk", "catalog", "rev", "period (declared, not computed)", "since"],
      rows: [{ name: "Desk Nine", cells: ["Desk Nine", "harbour-lamps", "3", "30", "2026-10-17"] },
        { name: "Desk Ten", cells: ["Desk Ten", "harbour-lamps", "2", "30", "2026-10-10"], removed: true }],
      refused: [], quiet: [], live: { n: 1 }, span: "rolling-30", days: 30, removedLeft: [{ name: "desks/k-0123456789abcdef/stats.estat" }] } });
    P.__get("statsViewOf").set(dir, "every");
    P.__get("paintStats")();
    const h = home.node("#main").innerHTML;
    const rowOf = (name) => (h.split("<tr>").find((r) => r.indexOf(">" + name) >= 0) || "");
    const leftSaid = h.split("desks/k-0123456789abcdef/stats.estat").length - 1;
    return { nine: rowOf("Desk Nine"), ten: rowOf("Desk Ten"), h, leftSaid };
  };
  const EN = "From a teammate since removed", PL = "Od członka zespołu, którego już w nim nie ma";
  const en = paintIn("en"), pl = paintIn("pl");
  const LEFT_EN = "is not counted: it came from a teammate since removed, and this Studio cannot show it was stored before the removal.";
  const LEFT_PL = "nie jest liczony: pochodzi od członka zespołu, którego już w nim nie ma";
  const leftOk = en.leftSaid === 1 && en.h.indexOf(LEFT_EN) >= 0 && pl.leftSaid === 1 && pl.h.indexOf(LEFT_PL) >= 0 && pl.h.indexOf(LEFT_EN) < 0;
  check(en.ten.indexOf(EN) >= 0 && en.nine.indexOf(EN) < 0 && en.nine.length > 0 && pl.ten.indexOf(PL) >= 0 && pl.ten.indexOf(EN) < 0
    && pl.nine.indexOf(PL) < 0 && leftOk,
    "rs8s F2 on the statistics screen: the row of a desk since removed says \"" + EN + "\" " + (en.ten.indexOf(EN) >= 0) + ", in Polish \""
    + PL + "\" " + (pl.ten.indexOf(PL) >= 0) + "; a roster desk's row says neither " + (en.nine.length > 0 && en.nine.indexOf(EN) < 0
    && pl.nine.indexOf(PL) < 0) + "; a file of such a desk Studio cannot place before the removal is said not counted, in both languages " + leftOk);
};

LEGS.rs9 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs9");
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true });
  put(s.mirror, "harbour-lamps.ec", "{\"kind\":\"etiuda-sealed\",\"note\":\"Harbour lamps, Lantern Quay\"}\n");
  put(s.mirror, "catalog-asks/" + D.keyId + ".json", "{\"ask\":\"Lantern Quay\"}\n");
  await s.runner.sync(); await s.runner.idle();
  const desk = deskOf(world, lab, s, "desk", D, new Map([[1, s.teamKey]]));
  desk.ch.start(); await settle(desk.ch);
  put(desk.mirror, "desks/" + D.keyId + "/in-use.ec", "{\"inUse\":\"Harbour lamps\"}\n");
  await settle(desk.ch);
  const clear = world.relayText(s.rt);
  /* The lead's key id and the desks' are public and the relay is told them; the team, its catalogs and its paths are not. */
  const marks = [s.teamId, "harbour-lamps", "Harbour lamps", "Lantern Quay", "etiuda-team", "catalog-asks", "in-use", "studio-key",
    "etiuda-ring", "desks/"].filter((w) => clear.indexOf(w) >= 0);
  check(clear.length > 0 && marks.length === 0 && read(desk.mirror, "harbour-lamps.ec") !== null,
    "rs9 nothing private leaves Studio unsealed: the relay's store and bucket, read whole, hold none of ten markers (team id, catalog id and"
    + " name, a place name, file names, paths): " + (marks.length ? "found " + marks.join(", ") : "none"));
  await s.runner.stop(); await desk.ch.stop();
};

/* rs9's markers are words; these are Studio's keys (the test architect's condition 2 of 2026-10-18). A Studio leading two
   desks, a relay invitation with its copy up, an edition, a desk's file in, and an epoch move taking one desk off, so a desk's
   own copy and a second team key exist. Every secret, as hex, base64, base64url and latin1, is hunted in every place the
   relay or the disk holds, and in what Studio sends (each call's headers and body, and each socket frame). The lead's
   public key must be found in the relay's store and a team key written into a file of the mirror must be found by the same
   search, so a hunt that finds nothing has been seen to find. */
LEGS.rs9k = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs9k");
  const X = deskKeys(), Y = deskKeys();
  const s = await studioLead(world, lab, { roster: [X, Y], wraps: true });
  const lines = [];
  const runner = trackRunner({ roots: GRANT_ROOTS, teamsFile: s.teamsFile, vault: s.vault, keyFile: s.keyAt, secret: () => labSecret(s.keyAt), request: s.t.request,
    connect: s.t.connect, watch: false, pollMs: 1e9, say: (l) => lines.push(l) });
  await s.runner.stop();
  const sync = async () => { for (let i = 0; i < 2; i++) { await runner.sync(); await runner.idle(); } };
  await sync();
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } }, "Ada Quay", secret,
    Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  put(s.mirror, "harbour-lamps.ec", "{\"kind\":\"etiuda-sealed\",\"note\":\"an edition\"}\n");
  await sync();
  const desk = deskOf(world, lab, s, "desk", X, new Map([[1, s.teamKey]]));
  desk.ch.start(); await settle(desk.ch);
  put(desk.mirror, "desks/" + X.keyId + "/in-use.ec", "{\"inUse\":\"harbour\"}\n");
  await settle(desk.ch); await sync();
  const h = await heldTeam(s.mirror, { key: s.keyAt });
  const next = await newEpoch(h.team, { key: s.keyAt, remove: Y.keyId, secret: labSecret(s.keyAt) });
  await writeTeam(s.mirror, next.team, { key: s.keyAt, passphrase: labSecret(s.keyAt) });
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, next.team.epoch, next.teamKey);
  await sync();
  await desk.ch.stop(); await runner.stop();
  const open = unlockKey(readKeyFile(s.keyAt), labSecret(s.keyAt)), box = openLeadBox(readKeyFile(s.keyAt), open);
  const raw = (k) => k.export({ type: "pkcs8", format: "der" }).subarray(-32);
  const copyX = world.C.deskCopyOf(agreeWith(X.box)(box.public), { rt: s.rt, teamId: s.teamId, leadKeyId: s.lead.keyId, leadBox: box.public,
    deskId: X.keyId, deskBox: X.box.pub });
  const secrets = { "signing key": raw(open.privateKey), "signing key, PKCS#8": open.privateKey.export({ type: "pkcs8", format: "der" }),
    "box secret": raw(box.secretKey), "team key 1": Buffer.from(s.teamKey), "team key 2": Buffer.from(next.teamKey),
    "invitation secret": Buffer.from(secret, "hex"), "invitation seal key": Buffer.from(ri.seal), "invitation token": Buffer.from(ri.token, "hex"),
    "desk copy key": copyX && copyX.key ? Buffer.from(copyX.key) : null, passphrase: Buffer.from(PASS, "utf8") };
  const forms = (b) => [b.toString("hex"), b.toString("base64"), b.toString("base64url"), b.toString("latin1")].filter((f) => f.length >= 16);
  const walk = (dir) => { const out = []; for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, n.name); if (n.isDirectory()) out.push(...walk(p)); else out.push(p); } return out; };
  const places = () => ({ "relay store and bucket": world.relayText(s.rt),
    mirror: walk(s.mirror).map((f) => fs.readFileSync(f).toString("latin1")).join("\n"),
    "the layer's record": fs.existsSync(s.mirror + ".json") ? fs.readFileSync(s.mirror + ".json", "latin1") : "",
    "teams file": fs.readFileSync(s.teamsFile, "latin1"), "said lines": lines.join("\n"), "calls": s.t.log.join("\n"),
    sent: (s.t.sent || []).join("\n") });
  const hunt = (where) => {
    const hits = [];
    for (const [pn, text] of Object.entries(where)) for (const [sn, b] of Object.entries(secrets)) {
      if (b && forms(b).concat(sn === "passphrase" ? [PASS] : []).some((f) => text.indexOf(f) >= 0)) hits.push(sn + " in " + pn);
    }
    return hits;
  };
  const hits = hunt(places());
  /* The controls: a public key the relay is told, found; a secret written into the mirror, found by the same hunt. */
  const pubFound = world.relayText(s.rt).indexOf(s.lead.public) >= 0;
  const plantAt = path.join(s.mirror, "rs9k-control.txt");
  fs.writeFileSync(plantAt, "control " + Buffer.from(next.teamKey).toString("base64") + "\n");
  const control = hunt(places());
  fs.renameSync(plantAt, path.join(lab, "rs9k-control.txt"));
  check(!!copyX && next.team.epoch === 2 && hits.length === 0 && pubFound && control.indexOf("team key 2 in mirror") >= 0,
    "rs9k no private key of Studio's leaves it: " + Object.keys(secrets).length + " secrets (signing key, its PKCS#8, box secret, team keys 1"
    + " and 2, the invitation's secret, seal key and token, a desk copy's key, the passphrase), each in four encodings, hunted in the relay's"
    + " store and bucket, the mirror, the layer's record, the teams file, the said lines, the calls, and what Studio sends (each call's headers"
    + " and body, and each socket frame): " + (hits.length ? "found " + hits.join(", ")
    : "none") + "; CONTROLS: the lead's public key found in the relay's store " + pubFound + ", a team key written into the mirror found "
    + (control.indexOf("team key 2 in mirror") >= 0));
};

/* Where a freshly loaded src/wire.cjs sends a relay call. `at` is the file; `origin` is ETIUDA_RELAY_ORIGIN, or unset. */
async function relayDoor(at, origin) {
  const Module = nodeRequire("node:module"), load = Module._load, was = process.env.ETIUDA_RELAY_ORIGIN, seen = [];
  const electron = { net: { fetch: async (url) => { seen.push(String(url)); return { status: 200, headers: { get: () => null },
    body: new ReadableStream({ start(c) { c.close(); } }) }; } } };
  if (origin === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = origin;
  const RealWS = globalThis.WebSocket, sockets = [];
  globalThis.WebSocket = function (url) { sockets.push(String(url)); this.readyState = 0; };
  Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
  const PROD = "https://etiuda.dev/relay/v1/teams", STAGING = "https://etiuda.dev/relay-staging/v1/teams";
  try {
    delete nodeRequire.cache[nodeRequire.resolve(at)];
    const wire = nodeRequire(at);
    const ask = async (url) => {
      try { await wire.relayRequest("POST", url, {}, Buffer.from("{}")); return seen[seen.length - 1] === url ? "sent" : "other"; }
      catch (e) { return /reaches the relay at/.test(String(e && e.message)) ? "refused" : "other"; }
    };
    const toStaging = await ask(STAGING), toProd = await ask(PROD);
    const open = (url) => { const n = sockets.length, s = wire.relayConnect(url, {}, { message() {}, close() {} }); return s ? sockets[n] || "open" : null; };
    return { toStaging, toProd, sockStaging: open("wss://etiuda.dev/relay-staging/v1/t/x/socket"), sockProd: open("wss://etiuda.dev/relay/v1/t/x/socket") };
  } finally {
    Module._load = load;
    globalThis.WebSocket = RealWS;
    try { delete nodeRequire.cache[nodeRequire.resolve(at)]; } catch { /* already gone */ }
    if (was === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = was;
  }
}
const STAGING_ORIGIN = "https://etiuda.dev/relay-staging/v1/";

LEGS.rs10 = async () => {
  const wire = nodeRequire(path.join(ROOT, "src", "wire.cjs"));
  const tries = ["https://example.com/relay/v1/teams", "http://etiuda.dev/relay/v1/teams", "https://etiuda.dev/other/v1/teams",
    "https://etiuda.dev.example.com/relay/v1/teams"];
  const refused = [];
  for (const u of tries) {
    try { await wire.relayRequest("POST", u, {}, Buffer.from("{}")); refused.push("sent"); }
    catch (e) { refused.push(/reaches the relay at/.test(String(e && e.message)) ? "refused" : "other: " + (e && e.message)); }
  }
  const sock = wire.relayConnect("wss://example.com/relay/v1/t/x/socket", {}, { message() {}, close() {} });
  check(refused.every((r) => r === "refused") && sock === null,
    "rs10 Studio's one door to the network refuses every address but the relay's before anything is sent: " + refused.join(", ")
    + "; a socket elsewhere " + (sock === null ? "none" : "opened"));
};

LEGS.rs10a = async () => {
  const d = await relayDoor(path.join(ROOT, "src", "wire.cjs"), STAGING_ORIGIN);
  check(d.toStaging === "sent" && d.toProd === "refused" && !!d.sockStaging && !d.sockProd,
    "rs10a with ETIUDA_RELAY_ORIGIN set to staging, outside app.asar, a call to that origin is sent and one to /relay/v1/ is refused,"
    + " and the socket follows: " + [d.toStaging, d.toProd, d.sockStaging ? "socket-staging" : "no-socket-staging", d.sockProd ? "socket-prod" : "no-socket-prod"].join(" "));
};

LEGS.rs10b = async () => {
  const tree = path.join(ROOT, "src", "wire.cjs");
  const installed = path.join(labDir("relay-rs10b"), "resources", "app.asar", "src", "wire.cjs");
  fs.mkdirSync(path.dirname(installed), { recursive: true });
  fs.copyFileSync(tree, installed);
  const out = await relayDoor(tree, STAGING_ORIGIN), inn = await relayDoor(installed, STAGING_ORIGIN);
  check(out.toStaging === "sent" && out.toProd === "refused" && inn.toStaging === "refused" && inn.toProd === "sent"
    && !!inn.sockProd && !inn.sockStaging,
    "rs10b the same value is ignored when the file sits inside app.asar, so only /relay/v1/ is reached: tree "
    + out.toStaging + "/" + out.toProd + ", installed " + inn.toStaging + "/" + inn.toProd
    + (inn.sockProd ? " socket-prod" : " no-socket-prod") + (inn.sockStaging ? " socket-staging" : " no-socket-staging"));
};

LEGS.rs10c = async () => {
  const tree = path.join(ROOT, "src", "wire.cjs");
  const malformed = ["http://etiuda.dev/relay-staging/v1/", "https://example.com/relay-staging/v1/", "https://etiuda.dev/relay-staging/",
    "https://etiuda.dev/relay-staging/v1/extra", "https://etiuda.dev/Relay-staging/v1/"];
  const got = [];
  for (const v of malformed) { const d = await relayDoor(tree, v); got.push(d.toStaging + "/" + d.toProd); }
  const good = await relayDoor(tree, STAGING_ORIGIN);
  check(good.toStaging === "sent" && got.every((g) => g === "refused/sent"),
    "rs10c a value that is not https on etiuda.dev of the form /<name>/v1/ is ignored, and one that is of that form is not: valid "
    + good.toStaging + "; " + malformed.map((v, i) => v + " -> " + got[i]).join("; "));
};

LEGS.rs10d = async () => {
  const want = "https://etiuda.dev/relay-staging/v1", keptUrl = "https://etiuda.dev/relay/v1";
  const was = process.env.ETIUDA_RELAY_ORIGIN;
  process.env.ETIUDA_RELAY_ORIGIN = STAGING_ORIGIN;
  const wireAt = path.join(ROOT, "src", "wire.cjs");
  try { delete nodeRequire.cache[nodeRequire.resolve(wireAt)]; } catch { /* not loaded */ }
  let named = "", kept = "", err = "";
  try {
    const fresh = await import(pathToFileURL(path.join(ROOT, "src", "relay.mjs")).href + "?rs10d=" + process.pid);
    const lab = labDir("relay-rs10d"), keyAt = path.join(lab, "studio-key.json");
    const lead = await labLeadKey();
    fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
    const writeOne = async (folder, url) => {
      fs.mkdirSync(folder, { recursive: true });
      const id = "t-" + fresh.relayId().slice(0, 16);
      let team = newTeam({ id, catalogs: ["harbour-lamps"], lead: { keyId: lead.keyId, public: lead.public }, sealed: true });
      team = withChannel(team, { kind: "relay", rt: fresh.relayId(), url }, RING);
      await writeTeam(folder, team, { key: keyAt, passphrase: labSecret(keyAt) });
      const back = await readTeam(folder);
      return back.team && back.team.channel ? back.team.channel.url : "";
    };
    named = await writeOne(path.join(lab, "new"), fresh.RELAY_URL);
    kept = await writeOne(path.join(lab, "old"), keptUrl);
  } catch (e) { err = String(e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e); }
  finally {
    if (was === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = was;
    try { delete nodeRequire.cache[nodeRequire.resolve(wireAt)]; } catch { /* already gone */ }
  }
  check(!err && named === want && kept === keptUrl,
    "rs10d a team made under the override names that address, without the shape's trailing slash, and a team file written with the"
    + " production address keeps it: " + (err || named + " | " + kept));
};

/* The installed copy's door: the file sits inside app.asar, so the environment cannot move the address. `requestUrl` is
 * asked through relayRequest and `socketUrl` through relayConnect. */
async function installedDoor(requestUrl, socketUrl) {
  const at = path.join(labDir("relay-rs10e"), "resources", "app.asar", "src", "wire.cjs");
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "src", "wire.cjs"), at);
  const Module = nodeRequire("node:module"), load = Module._load, was = process.env.ETIUDA_RELAY_ORIGIN, seen = [];
  const electron = { net: { fetch: async (url) => { seen.push(String(url)); return { status: 200, headers: { get: () => null },
    body: new ReadableStream({ start(c) { c.close(); } }) }; } } };
  delete process.env.ETIUDA_RELAY_ORIGIN;
  const RealWS = globalThis.WebSocket, sockets = [];
  globalThis.WebSocket = function (url) { sockets.push(String(url)); this.readyState = 0; };
  Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
  try {
    delete nodeRequire.cache[nodeRequire.resolve(at)];
    const wire = nodeRequire(at);
    let requestGot = "other";
    try {
      await wire.relayRequest("POST", requestUrl, {}, Buffer.from("{}"));
      requestGot = seen[seen.length - 1] === requestUrl ? "sent" : "other";
    } catch (e) { requestGot = /reaches the relay at/.test(String(e && e.message)) ? "refused" : "other"; }
    const n = sockets.length;
    const opened = wire.relayConnect(socketUrl, {}, { message() {}, close() {} });
    return { requestGot, socketGot: opened ? (sockets[n] || "open") : null };
  } finally {
    Module._load = load;
    globalThis.WebSocket = RealWS;
    try { delete nodeRequire.cache[nodeRequire.resolve(at)]; } catch { /* already gone */ }
    if (was === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = was;
  }
}

LEGS.rs10e = async () => {
  const dotDot = "https://etiuda.dev/relay/v1/../relay-staging/v1/teams";
  const dotSock = "wss://etiuda.dev/relay/v1/../relay-staging/v1/t/x/socket";
  const d = await installedDoor(dotDot, dotSock);
  check(d.requestGot === "refused" && !d.socketGot,
    "rs10e a dot-dot URL is refused at the request door and at the socket door from inside app.asar: "
    + d.requestGot + (d.socketGot ? " socket-open" : " no-socket"));
};

LEGS.rs10f = async () => {
  const encoded = "https://etiuda.dev/relay/v1/%2e%2e/relay-staging/v1/teams";
  const encodedSock = "wss://etiuda.dev/relay/v1/%2e%2e/relay-staging/v1/t/x/socket";
  const d = await installedDoor(encoded, encodedSock);
  check(d.requestGot === "refused" && !d.socketGot,
    "rs10f the same URL with %2e%2e is refused at both doors from inside app.asar: "
    + d.requestGot + (d.socketGot ? " socket-open" : " no-socket"));
};

LEGS.rs10g = async () => {
  const good = "https://etiuda.dev/relay/v1/teams";
  const goodSock = "wss://etiuda.dev/relay/v1/t/x/socket";
  const d = await installedDoor(good, goodSock);
  check(d.requestGot === "sent" && d.socketGot === goodSock,
    "rs10g a plain good URL is still sent from inside app.asar, and its socket opens: "
    + d.requestGot + " " + (d.socketGot || "no-socket"));
};

/* AN ORDINARY BUILD HOLDING A STAGING TEAM (the lead engineer's criterion beside Max's of 2026-11-13 10:26): a team a test service
   build made lives on staging's relay, and the ordinary build installed over it again reaches the relay alone. The team must stay as
   it was, its data kept, and nothing said as a fault: the runner calls nothing for a relay this build does not reach (src/relay.mjs
   relayReached) and the Desks screen says that in the copywriter's words. The real src/wire.cjs of this tree, ordinary, stands behind
   every call the runner does make. */
LEGS.rts1 = async () => {
  const lab = labDir("relay-rts1"), ud = path.join(lab, "studio-ud"), STAGING_RELAY = "https://etiuda.dev/relay-staging/v1", LIVE_RELAY = "https://etiuda.dev/relay/v1";
  fs.mkdirSync(ud, { recursive: true });
  const was = process.env.ETIUDA_RELAY_ORIGIN, wireAt = path.join(ROOT, "src", "wire.cjs");
  delete process.env.ETIUDA_RELAY_ORIGIN;
  let err = "", out = null, said = [], before = null, after = null, rowBefore = null, rowAfter = null, liveAfter = null, keyKept = false;
  const sockets = [], asked = [], doorSets = [];
  const RealWS = globalThis.WebSocket;
  globalThis.WebSocket = function (url) { sockets.push(String(url)); this.readyState = 0; };
  let runner = null, teamId = "", liveId = "", stagedMirror = "";
  try {
    delete nodeRequire.cache[nodeRequire.resolve(wireAt)];
    const wire = nodeRequire(wireAt);
    const keyAt = path.join(ud, "studio-key.json"), lead = await labLeadKey();
    fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
    granted(keyAt, lead.public);
    const teamsFile = K.teamsFile(ud), vault = makeVault();
    /* Two teams this lead made, each with its door open: one a Test Service build made on staging's relay, and the control, one on
       the relay this build reaches, carrying the line a stale "elsewhere" would leave. */
    const made = async (url, extra) => {
      const rt = Relay.relayId(), id = "t-" + hex(8);
      K.keepTeamKey(teamsFile, vault, id, 1, crypto.randomBytes(32));
      const mirror = K.keepRelay(teamsFile, id, rt, url);
      K.markRelay(teamsFile, id, Object.assign({ created: true, lead: lead.public, door: lead.public + ":" + "ab".repeat(16) }, extra || {}));
      let team = newTeam({ id, catalogs: ["harbour-lamps"], lead: { keyId: lead.keyId, public: lead.public }, sealed: true, exportsSealed: true });
      team = withChannel(team, { kind: "relay", rt, url }, RING);
      fs.mkdirSync(mirror, { recursive: true });
      await writeTeam(mirror, team, { key: keyAt, passphrase: labSecret(keyAt) });
      return { id, mirror };
    };
    const staged = await made(STAGING_RELAY), live = await made(LIVE_RELAY, { syncNote: "elsewhere" });
    teamId = staged.id; liveId = live.id; stagedMirror = staged.mirror;
    fs.writeFileSync(path.join(staged.mirror, "harbour-lamps.txt"), "an edition the lead wrote while on staging\n");
    const rowOf = (id) => K.relayTeams(teamsFile).find((w) => w.team === id) || null;
    before = treeOf(staged.mirror); rowBefore = rowOf(teamId);
    runner = trackRunner({ roots: GRANT_ROOTS, teamsFile, vault, keyFile: keyAt, secret: () => labSecret(keyAt),
      request: (method, url, h, b) => { asked.push(String(url)); return wire.relayRequest(method, url, h, b); }, connect: wire.relayConnect,
      watch: false, pollMs: 1e9, say: (l) => said.push(String(l)), doorRefs: () => [],
      serviceDoors: async (doors) => { doorSets.push(doors.map((d) => d.team)); return { ok: true, doors: doors.length }; } });
    out = await runner.sync();
    await runner.idle();
    after = treeOf(staged.mirror); rowAfter = rowOf(teamId); liveAfter = rowOf(liveId);
    keyKept = !!K.keptTeam(teamsFile, teamId);
  } catch (e) { err = String(e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e); }
  finally {
    if (runner) { try { await runner.stop(); } catch { /* down already */ } }
    globalThis.WebSocket = RealWS;
    delete nodeRequire.cache[nodeRequire.resolve(wireAt)];
    if (was === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = was;
  }
  const mine = Array.isArray(out) ? out.find((w) => w && w.team === teamId) : null;
  const toStaging = asked.filter((u) => u.indexOf("/relay-staging/") >= 0).length + sockets.filter((u) => u.indexOf("/relay-staging/") >= 0).length;
  const without = (r) => JSON.stringify(Object.assign({}, r || {}, { syncNote: null }));
  const noted = rowAfter ? rowAfter.syncNote : "?", liveNoted = liveAfter ? liveAfter.syncNote : "?";
  const doorsLive = doorSets.length > 0 && doorSets.every((d) => d.indexOf(teamId) < 0) && doorSets[doorSets.length - 1].indexOf(liveId) >= 0;
  /* The Desks screen says the copywriter's words for it, in both languages. */
  const WORDS = { en: "This team is on Etiuda's test service, made there by the Test Service build; this build does not reach it, so it will not answer here. Its data is kept, and nothing is sent.",
    pl: "Ten zespół działa w testowej usłudze Etiudy, gdzie utworzyła go wersja Test Service; obecna wersja do niej nie sięga, więc zespół tu nie odpowie. Jego dane zostają, a nic nie jest wysyłane." };
  const enc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const { loadPage } = await import("./page-stand-in.mjs");
  const pageBad = [];
  for (const lang of ["en", "pl"]) {
    const home = loadPage({ api: {}, uiLang: lang }), P = home.page;
    Object.assign(P.S, { open: { dir: "C:/quay", draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [],
      project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
      host: { tour: { offered: true } }, screen: "projects", home: "team", teamDir: "C:/quay", cover: null, err: null, dkNote: null, q: "",
      desks: { team: { id: teamId || "t-0000000000000000", epoch: 1, relay: true, roster: [], sealed: true }, folder: stagedMirror, file: "ours", requests: [], syncNote: "elsewhere" } });
    P.paintMain();
    const html = home.node("#main").innerHTML;
    if (html.indexOf(enc(WORDS[lang])) < 0 || html.indexOf('data-sync-note="elsewhere"') < 0) pageBad.push(lang);
  }
  check(!err && !!mine && mine.reason === "elsewhere" && toStaging === 0 && noted === "elsewhere" && liveNoted === ""
    && without(rowAfter) === without(rowBefore) && JSON.stringify(after) === JSON.stringify(before) && keyKept && doorsLive && pageBad.length === 0,
    "rts1 an ordinary build holding a team made on staging's relay finishes its sync without a throw and calls nothing for it (" + toStaging
    + " calls or sockets to staging; its entry " + (mine ? mine.reason : "missing") + "), sets no door for it (door sets " + JSON.stringify(doorSets.map((d) => d.map((x) => x === teamId ? "staging" : x === liveId ? "live" : x)))
    + "), notes \"elsewhere\" for the Desks screen (" + JSON.stringify(noted) + ") and says the copywriter's words there in English and Polish"
    + (pageBad.length ? " (MISSING: " + pageBad.join(", ") + ")" : "") + ", and keeps the team's record otherwise, its key and its mirror byte for byte: record "
    + (without(rowAfter) === without(rowBefore) ? "same" : "CHANGED") + ", mirror " + (JSON.stringify(after) === JSON.stringify(before) ? Object.keys(before || {}).length + " entries same" : "CHANGED")
    + ", key " + (keyKept ? "kept" : "GONE") + "; CONTROL: the team on the relay this build reaches drops a stale \"elsewhere\" (" + JSON.stringify(liveNoted) + ")" + (err ? "; " + err : ""));
};

/* The test architect, 2026-11-13, on rts1's door filter: "relayReached normalises, but the service compares the bare string (one slash
   stripped) [...] The fix would be for the filter to compare as the service does." Teams this lead made, each with its door open, one
   per address; nothing reaches a relay here (every request refused), only the set handed to the service is read. */
LEGS.rts2 = async () => {
  const lab = labDir("relay-rts2"), ud = path.join(lab, "studio-ud"), LIVE = "https://etiuda.dev/relay/v1";
  fs.mkdirSync(ud, { recursive: true });
  const URLS = [LIVE, LIVE + "/", LIVE + "/../v1", "https://etiuda.dev/relay/./v1", "https://etiuda.dev:443/relay/v1",
    "https://etiuda.dev/relay/x/../v1", LIVE + "/.", LIVE + "/./"];
  const was = process.env.ETIUDA_RELAY_ORIGIN;
  delete process.env.ETIUDA_RELAY_ORIGIN;
  let err = "", sets = [], byUrl = {}, svcOk = null;
  const RealWS = globalThis.WebSocket;
  globalThis.WebSocket = function () { this.readyState = 0; };
  let runner = null;
  try {
    svcOk = (await import(pathToFileURL(path.join(ROOT, "service", "licence", "core.mjs")).href)).doorRelayOk;
    const keyAt = path.join(ud, "studio-key.json"), lead = await labLeadKey();
    fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
    granted(keyAt, lead.public);
    const teamsFile = K.teamsFile(ud), vault = makeVault();
    for (const url of URLS) {
      const rt = Relay.relayId(), id = "t-" + hex(8);
      K.keepTeamKey(teamsFile, vault, id, 1, crypto.randomBytes(32));
      const mirror = K.keepRelay(teamsFile, id, rt, url);
      K.markRelay(teamsFile, id, { created: true, lead: lead.public, door: lead.public + ":" + "ab".repeat(16) });
      let team = newTeam({ id, catalogs: ["harbour-lamps"], lead: { keyId: lead.keyId, public: lead.public }, sealed: true, exportsSealed: true });
      team = withChannel(team, { kind: "relay", rt, url }, RING);
      fs.mkdirSync(mirror, { recursive: true });
      await writeTeam(mirror, team, { key: keyAt, passphrase: labSecret(keyAt) });
      byUrl[id] = url;
    }
    runner = trackRunner({ roots: GRANT_ROOTS, teamsFile, vault, keyFile: keyAt, secret: () => labSecret(keyAt),
      request: async () => { throw new Error("no relay in this part"); }, connect: () => null,
      watch: false, pollMs: 1e9, say: () => {}, doorRefs: () => [],
      serviceDoors: async (doors) => { sets.push(doors.map((d) => d.url)); return { ok: true, doors: doors.length }; } });
    await runner.sync();
    await runner.idle();
  } catch (e) { err = String(e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e); }
  finally {
    if (runner) { try { await runner.stop(); } catch { /* down already */ } }
    globalThis.WebSocket = RealWS;
    if (was === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = was;
  }
  const sent = sets.length ? sets[sets.length - 1].slice().sort() : null;
  const taken = svcOk ? URLS.filter((u) => svcOk(u, false)).sort() : [];
  const refused = svcOk ? URLS.filter((u) => !svcOk(u, false)) : [];
  check(!err && !!sent && JSON.stringify(sent) === JSON.stringify(taken) && taken.length === 2 && refused.length === URLS.length - 2,
    "rts2 the door set holds exactly the addresses the licence service's doorRelayOk takes: sent " + JSON.stringify(sent)
    + ", the service takes " + JSON.stringify(taken) + " and refuses " + refused.length + " lookalikes " + JSON.stringify(refused)
    + (err ? "; " + err : ""));
};

/* GROK'S REVIEW 9 OF THE RELAY MEMBER, FINDING 1 (the test architect's spot-check, 2026-11-15 13:48: "catalogIn [...] returns any JSON
   object that is not a sealed envelope as the catalog, and editionsLed [...] takes the higher rev and later date with no signature
   check"). Through the runner's own head write on a relay team listing two catalogs: three files that the team's lead key did not
   sign, each claiming a higher rev and a later date, and then a file sealed for an epoch this Studio does not hold. */
LEGS.rsm9a = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsm9a");
  const s = await studioLead(world, lab);
  const open = unlockKey(readKeyFile(s.keyAt), labSecret(s.keyAt)), stranger = keyPair(true), seal = Engine.sealRules();
  const sealed = (doc, key, epoch) => JSON.stringify(seal.sealCatalog(key || s.teamKey, s.teamId, epoch || 1, JSON.stringify(doc))) + "\n";
  const signedBy = (k, doc) => signCatalog(doc, { privateKey: k.privateKey, keyId: k.keyId });
  const named = (id) => {
    let h = null;
    try { h = JSON.parse(read(s.mirror, Relay.HEAD_NAME)); } catch { return "no head"; }
    const e = h && Array.isArray(h.editions) ? h.editions.find((x) => x && x.catalog === id) : null;
    return e ? e.rev + "@" + e.edition : "none";
  };
  let clock = Date.now();
  const round = async () => { s.setClock(clock += 1000); await s.runner.sync(); await s.runner.idle(); };
  const held = (await heldTeam(s.mirror, { key: s.keyAt })).team;
  await writeTeam(s.mirror, withCatalog(held, "salt-quay"), { key: s.keyAt, passphrase: labSecret(s.keyAt) });
  put(s.mirror, "harbour-lamps.ec", sealed(await signedBy(open, { id: "harbour-lamps", rev: 2, date: "2026-11-01" })));
  put(s.mirror, "salt-quay.ec", sealed(await signedBy(open, { id: "salt-quay", rev: 1, date: "2026-11-01" })));
  await round();
  const ok = { first: named("harbour-lamps") === "2@2026-11-01" && named("salt-quay") === "1@2026-11-01" };
  const seen = {};
  const tryFile = async (name, bytes, key) => {
    put(s.mirror, name, bytes);
    await round();
    seen[key] = named("harbour-lamps");
    ok[key] = seen[key] === "2@2026-11-01";
    fs.unlinkSync(path.join(s.mirror, name));
  };
  await tryFile("zz-plain.ec", JSON.stringify({ id: "harbour-lamps", rev: 3, date: "2026-11-02" }) + "\n", "plain");
  await tryFile("zz-sealed.ec", sealed({ id: "harbour-lamps", rev: 4, date: "2026-11-03" }), "sealedUnsigned");
  await tryFile("zz-other.ec", sealed(await signedBy(stranger, { id: "harbour-lamps", rev: 5, date: "2026-11-04" })), "otherKey");
  /* CONTROL: the lead's own next edition moves the head. */
  put(s.mirror, "harbour-lamps.ec", sealed(await signedBy(open, { id: "harbour-lamps", rev: 6, date: "2026-11-05" })));
  await round();
  seen.control = named("harbour-lamps");
  ok.control = seen.control === "6@2026-11-05";
  /* Sequence B: salt-quay's file now sealed for an epoch this Studio holds no key for. */
  put(s.mirror, "salt-quay.ec", sealed(await signedBy(open, { id: "salt-quay", rev: 2, date: "2026-11-06" }), crypto.randomBytes(32), 7));
  await round();
  seen.unopened = named("salt-quay");
  ok.unopened = seen.unopened === "1@2026-11-01" && named("harbour-lamps") === "6@2026-11-05";
  /* What the head named is read only from a head the lead signed: one another key signed, put in its place, names nothing kept. */
  const team = (await heldTeam(s.mirror, { key: s.keyAt })).team;
  put(s.mirror, Relay.HEAD_NAME, JSON.stringify(Relay.headOf(stranger, team, clock, [{ catalog: "salt-quay", rev: 9, edition: "2026-11-09", published: "2026-11-09" }])) + "\n");
  clock += Relay.HEAD_MS;
  await round();
  seen.forged = named("salt-quay");
  ok.forged = seen.forged !== "9@2026-11-09" && named("harbour-lamps") === "6@2026-11-05";
  /* CONTROL: with every file at the root opening, salt-quay's gone file takes it off the head. */
  fs.unlinkSync(path.join(s.mirror, "salt-quay.ec"));
  await round();
  seen.gone = named("salt-quay");
  ok.gone = seen.gone === "none" && named("harbour-lamps") === "6@2026-11-05";
  check(Object.values(ok).every((v) => v === true),
    "rsm9a the head names only an edition the team's lead key signed: first " + ok.first + "; a plain file claiming rev 3 leaves it at "
    + seen.plain + ", one sealed under the team key and unsigned (rev 4) at " + seen.sealedUnsigned + ", one signed by another key (rev 5) at "
    + seen.otherKey + "; a file that will not open keeps the catalog the head named (" + seen.unopened + "), read only from a head the lead signed"
    + " (another key's head naming rev 9 put in its place leaves " + seen.forged + "); CONTROLS: the lead's rev 6 moves it to "
    + seen.control + ", and a catalog whose file is gone while every file opens leaves it (" + seen.gone + ")");
  await s.runner.stop();
};

/* The same review's finding 1 reaches a handover too: handoverTeam re-signs every edition at the root whose id the team lists under the
   new key, so a file the old lead never signed would come out of it signed by the new one, and named in the head it writes. */
LEGS.rsm9b = async () => {
  const lab = labDir("relay-rsm9b"), dir = path.join(lab, "share");
  fs.mkdirSync(dir, { recursive: true });
  const S = await import("../src/studio.mjs"), Rng = await import("../src/ring.mjs");
  const oldKeyPath = path.join(lab, "old-key.json"), newKeyPath = path.join(lab, "new-key.json");
  fs.writeFileSync(oldKeyPath, JSON.stringify(await labLeadKey(), null, 1) + "\n");
  fs.writeFileSync(newKeyPath, JSON.stringify(await labLeadKey(), null, 1) + "\n");
  const oldOpen = unlockKey(readKeyFile(oldKeyPath), labSecret(oldKeyPath)), newOpen = unlockKey(readKeyFile(newKeyPath), labSecret(newKeyPath));
  const teamId = "t-" + hex(8), catId = "harbour-lamps";
  const team0 = newTeam({ id: teamId, catalogs: [catId], lead: { keyId: oldOpen.keyId, public: oldOpen.public }, sealed: false, exportsSealed: false });
  await writeTeam(dir, team0, { key: oldKeyPath, passphrase: labSecret(oldKeyPath) });
  Rng.addToRing(path.join(dir, "etiuda-ring.json"), await Rng.entryFor(readKeyFile(oldKeyPath), catId));
  const realAt = path.join(dir, catId + ".ec"), plantAt = path.join(dir, "zz-plant.ec");
  fs.writeFileSync(realAt, JSON.stringify(await signCatalog({ id: catId, rev: 1, date: "2026-11-01" }, { privateKey: oldOpen.privateKey, keyId: oldOpen.keyId })) + "\n");
  fs.writeFileSync(plantAt, JSON.stringify({ id: catId, rev: 2, date: "2026-11-02" }) + "\n");
  fs.writeFileSync(path.join(dir, Relay.HEAD_NAME), JSON.stringify(Relay.headOf(oldOpen, team0, Date.now(),
    [{ catalog: catId, rev: 1, edition: "2026-11-01", published: "2026-11-01" }]), null, 1) + "\n");
  let err = "";
  try { await S.handoverTeam(dir, { key: newKeyPath, passphrase: labSecret(newKeyPath), oldKey: oldKeyPath, oldPassphrase: labSecret(oldKeyPath), folder: dir }); }
  catch (e) { err = String(e && e.message || e); }
  const doc = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
  const plant = doc(plantAt), real = doc(realAt), head = doc(path.join(dir, Relay.HEAD_NAME));
  const entry = head && Array.isArray(head.editions) ? head.editions.find((e) => e && e.catalog === catId) : null;
  const ok = { ran: !err, plantUnsigned: !!plant && !plant.sig, headOld: !!entry && entry.rev === 1 && !!head.sig && head.sig.keyId === newOpen.keyId,
    realResigned: !!real && !!real.sig && real.sig.keyId === newOpen.keyId };
  check(Object.values(ok).every((v) => v === true),
    "rsm9b a handover re-signs only the editions the old lead signed: the plain file at the root is left unsigned " + ok.plantUnsigned
    + " (signed by " + (plant && plant.sig ? (plant.sig.keyId === newOpen.keyId ? "the NEW lead" : "another key") : "nobody") + "), the head the new lead signs names rev "
    + (entry ? entry.rev : "none") + " " + ok.headOld + "; CONTROL: the lead's own edition is re-signed by the new key " + ok.realResigned + (err ? "; " + err : ""));
};

/* FINDING 2 (the test architect's spot-check: "keepServiceDoors sorts by team id and slices to 16 [...], and the service deletes the doors
   left out"). Sixteen teams with open doors, set; then a seventeenth whose id sorts before all of them. Nothing reaches a relay (every
   request refused), only the sets handed to the service and the runner's lines are read. */
LEGS.rsm9c = async () => {
  const lab = labDir("relay-rsm9c"), ud = path.join(lab, "studio-ud"), LIVE = "https://etiuda.dev/relay/v1";
  fs.mkdirSync(ud, { recursive: true });
  const was = process.env.ETIUDA_RELAY_ORIGIN;
  delete process.env.ETIUDA_RELAY_ORIGIN;
  const RealWS = globalThis.WebSocket;
  globalThis.WebSocket = function () { this.readyState = 0; };
  let err = "", runner = null;
  const sets = [], lines = [], ids = [], late = "t-0" + hex(8).slice(1);
  let atLate = [];
  const ok = {};
  try {
    const keyAt = path.join(ud, "studio-key.json"), lead = await labLeadKey();
    fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
    granted(keyAt, lead.public);
    const teamsFile = K.teamsFile(ud), vault = makeVault();
    const make = async (id) => {
      const rt = Relay.relayId();
      K.keepTeamKey(teamsFile, vault, id, 1, crypto.randomBytes(32));
      const mirror = K.keepRelay(teamsFile, id, rt, LIVE);
      K.markRelay(teamsFile, id, { created: true, lead: lead.public, door: lead.public + ":" + "ab".repeat(16) });
      let team = newTeam({ id, catalogs: ["harbour-lamps"], lead: { keyId: lead.keyId, public: lead.public }, sealed: true, exportsSealed: true });
      team = withChannel(team, { kind: "relay", rt, url: LIVE }, RING);
      fs.mkdirSync(mirror, { recursive: true });
      await writeTeam(mirror, team, { key: keyAt, passphrase: labSecret(keyAt) });
    };
    for (let i = 0; i < 16; i++) { const id = "t-f" + hex(8).slice(1); ids.push(id); await make(id); }
    runner = trackRunner({ roots: GRANT_ROOTS, teamsFile, vault, keyFile: keyAt, secret: () => labSecret(keyAt),
      request: async () => { throw new Error("no relay in this part"); }, connect: () => null,
      watch: false, pollMs: 1e9, say: (l) => lines.push(l), doorRefs: () => [],
      serviceDoors: async (doors) => { sets.push(doors.map((d) => d.team)); return { ok: true, doors: doors.length }; } });
    const lastSet = () => (sets.length ? JSON.stringify(sets[sets.length - 1].slice().sort()) : "none");
    await runner.sync(); await runner.idle();
    ok.first = lastSet() === JSON.stringify(ids.slice().sort());
    await make(late);
    await runner.sync(); await runner.idle();
    ok.kept = lastSet() === JSON.stringify(ids.slice().sort());
    atLate = sets.length ? sets[sets.length - 1] : [];
    ok.told = lines.some((l) => l.indexOf(late) >= 0 && l.indexOf("16") >= 0);
    /* CONTROL: one of the sixteen closes its door, and the seventeenth takes the place it frees. */
    K.markRelay(teamsFile, ids[5], { door: lead.public + ":" });
    await runner.sync(); await runner.idle();
    ok.freed = lastSet() === JSON.stringify(ids.filter((x) => x !== ids[5]).concat([late]).sort());
    /* The door reopens: the service now holds the seventeenth's, so the reopened team, though older in the file, waits and is said. */
    const saidBefore = lines.length;
    K.markRelay(teamsFile, ids[5], { door: lead.public + ":" + "ab".repeat(16) });
    await runner.sync(); await runner.idle();
    ok.reopened = lastSet() === JSON.stringify(ids.filter((x) => x !== ids[5]).concat([late]).sort())
      && lines.slice(saidBefore).some((l) => l.indexOf(ids[5]) >= 0);
    const num = (file, re) => { const m = fs.readFileSync(path.join(ROOT, file), "utf8").match(re); return m ? +m[1] : NaN; };
    ok.sameCap = num("src/relay.mjs", /const SERVICE_DOORS = (\d+);/) === num("service/licence/core.mjs", /const DOORS_PER_LEAD = (\d+)/);
  } catch (e) { err = String(e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e); }
  finally {
    if (runner) { try { await runner.stop(); } catch { /* down already */ } }
    globalThis.WebSocket = RealWS;
    if (was === undefined) delete process.env.ETIUDA_RELAY_ORIGIN; else process.env.ETIUDA_RELAY_ORIGIN = was;
  }
  check(!err && Object.values(ok).every((v) => v === true) && Object.keys(ok).length === 6,
    "rsm9c a seventeenth team never drops another team's door at the licence service: the sixteen set " + ok.first + ", still the same sixteen after"
    + " the seventeenth is made " + ok.kept + " (the set then held the seventeenth " + atLate.includes(late) + " and lacked " + ids.filter((x) => !atLate.includes(x)).length
    + " of the sixteen), the seventeenth left out is said " + ok.told + "; CONTROL: a door closed frees its place for it " + ok.freed + "; reopened, that"
    + " older team waits behind the door the service now holds, and is said " + ok.reopened + "; the cap is the service's DOORS_PER_LEAD " + ok.sameCap + " (" + sets.length + " sets)"
    + (err ? "; " + err : ""));
};

/* The test architect, 2026-10-20: "every relay request carries a timeout (`net.fetch` with an abort signal), so no cycle can
   hang". A fresh src/wire.cjs is loaded with electron answered by a stand-in whose fetch honours the signal, and the timers
   that file arms are run a hundred times faster for this leg alone, each delay it asks for recorded. */
LEGS.rs10t = async () => {
  const Module = nodeRequire("node:module"), at = path.join(ROOT, "src", "wire.cjs"), SPEED = 100;
  const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
  const aborted = () => Object.assign(new Error("aborted"), { name: "AbortError" });
  let answer = null;
  const signals = [];
  const net = { fetch: (url, init) => { signals.push(init && init.signal); return answer(init); } };
  /* Never answers: rejects only when its signal aborts. */
  const hang = (init) => new Promise((resolve, reject) => {
    if (init.signal.aborted) reject(aborted());
    init.signal.addEventListener("abort", () => reject(aborted()), { once: true });
  });
  /* A response whose body the case writes through `feed(controller)`, errored when the signal aborts. */
  const respond = (init, feed) => ({ status: 200, headers: { get: (n) => (n === "etiuda-blob" ? "seen" : null) },
    body: new ReadableStream({ start(c) {
      init.signal.addEventListener("abort", () => { try { c.error(aborted()); } catch { /* closed */ } }, { once: true });
      feed(c);
    } }) });
  const prior = nodeRequire.cache[at], load = Module._load;
  delete nodeRequire.cache[at];
  Module._load = function (req) { return req === "electron" ? { net } : load.apply(this, arguments); };
  let wire = null;
  try { wire = nodeRequire(at); } finally {
    Module._load = load;
    delete nodeRequire.cache[at];
    if (prior) nodeRequire.cache[at] = prior;
  }
  /* Only the timers src/wire.cjs arms are recorded and sped; any other in the process runs as it would. */
  let asked = [];
  const live = new Set();
  globalThis.setTimeout = function (fn, ms, ...a) {
    if (!/wire\.cjs/.test(String(new Error().stack))) return realSet(fn, ms, ...a);
    asked.push(ms);
    const h = realSet(() => { live.delete(h); fn(...a); }, Math.max(1, Math.round(ms / SPEED)));
    live.add(h);
    return h;
  };
  globalThis.clearTimeout = function (h) { live.delete(h); return realClear(h); };
  const run = async (body) => {
    asked = [];
    const t0 = Date.now();
    try { const r = await wire.relayRequest("POST", "https://etiuda.dev/relay/v1/t/x/blob", {}, body); return { r, ms: Date.now() - t0 }; }
    catch (e) { return { err: String(e && e.message || e), ms: Date.now() - t0 }; }
  };
  try {
    /* a. headers never come. */
    const upload = Buffer.alloc(64 * 1024, 7), wantA = 30000 + Math.ceil(upload.length * 1000 / 32768);
    answer = hang;
    const a = await run(upload);
    const sigA = signals[signals.length - 1];
    check(!!a.err && /did not answer within/.test(a.err) && asked[0] === wantA && asked.length === 1 && !!sigA && sigA.aborted,
      "rs10t a. a relay that never sends its headers is cut and the call throws (" + (a.err || "it completed") + ", " + a.ms + " ms at a"
      + " hundredth of the time); the bound asked " + asked.join(", ") + " ms, wanted " + wantA + " (30 s plus 64 KiB at 32 KiB/s);"
      + " the signal aborted " + !!(sigA && sigA.aborted));
    /* b. the headers come, then one chunk, then silence. */
    answer = (init) => Promise.resolve(respond(init, (c) => { c.enqueue(new Uint8Array([1, 2, 3])); }));
    const b = await run(Buffer.from("{}"));
    const sigB = signals[signals.length - 1], afterB = asked.slice(1);
    check(!!b.err && /did not answer within/.test(b.err) && afterB.length >= 2 && afterB.every((ms) => ms === 30000) && !!sigB && sigB.aborted,
      "rs10t b. a body that stops after one chunk is cut and the call throws (" + (b.err || "it completed") + ", " + b.ms + " ms at a"
      + " hundredth of the time); the bounds asked after the headers " + afterB.join(", ") + " ms, each wanted 30000; the signal aborted "
      + !!(sigB && sigB.aborted));
    /* c. a body that keeps moving: sixteen chunks a fifth of the idle bound apart, about three bounds in all. */
    const gap = Math.round(30000 / SPEED / 5), sent = [];
    for (let i = 0; i < 16; i++) sent.push(crypto.randomBytes(4096));
    answer = (init) => Promise.resolve(respond(init, (c) => {
      let i = 0;
      const next = () => { if (init.signal.aborted) return; if (i === sent.length) { c.close(); return; } c.enqueue(new Uint8Array(sent[i++])); realSet(next, gap); };
      realSet(next, gap);
    }));
    const c = await run(Buffer.from("{}"));
    const whole = Buffer.concat(sent), boundMs = 30000 / SPEED;
    check(!c.err && !!c.r && Buffer.compare(c.r.bytes, whole) === 0 && c.ms > boundMs * 2 && asked.slice(1).every((ms) => ms === 30000),
      "rs10t c. a body that keeps sending, a chunk every " + gap + " ms for " + c.ms + " ms in all against an idle bound of " + boundMs
      + " ms, completes with every byte: " + (c.err ? "threw " + c.err : (c.r.bytes.length + " of " + whole.length + " bytes, "
      + (Buffer.compare(c.r.bytes, whole) === 0 ? "the same" : "NOT the same"))));
    /* d. a quick answer. */
    answer = (init) => Promise.resolve(respond(init, (c) => { c.enqueue(new TextEncoder().encode("{\"ok\":true}")); c.close(); }));
    const d = await run(Buffer.from("{}"));
    check(!d.err && !!d.r && d.r.status === 200 && d.r.bytes.toString("utf8") === "{\"ok\":true}" && d.r.header("etiuda-blob") === "seen"
      && asked.length >= 1 && live.size === 0,
      "rs10t d. a quick answer completes (" + (d.err ? "threw " + d.err : d.r.status + " " + d.r.bytes.toString("utf8")) + ") and leaves "
      + live.size + " of its " + asked.length + " timers pending");
  } finally {
    globalThis.setTimeout = realSet;
    globalThis.clearTimeout = realClear;
    for (const h of live) realClear(h);
  }
};

/* A blob the relay was handed, opened under `key` as anyone holding that key would open it, its bytes `ct` in hand: its frame
   ({kind, path, body}) or null. No signature or floor is asked, as a bearer of the key would ask none. */
function opensWith(world, rt, key, rec, ct) {
  if (!ct || !key || ct.length < 17) return null;
  try {
    const aad = world.B.aadOf({ relayTeamId: rt, epoch: rec.epoch, id: rec.id, supersedes: rec.supersedes == null ? null : rec.supersedes,
      writerKeyId: rec.writer, counter: rec.counter });
    const d = crypto.createDecipheriv("aes-256-gcm", Buffer.from(key), Buffer.from(String(rec.nonce), "hex"), { authTagLength: 16 });
    d.setAAD(aad);
    d.setAuthTag(ct.subarray(ct.length - 16));
    return world.B.unframe(Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]));
  } catch { return null; }
}

/* N1 of the slice 1 review (the test architect's triage of 2026-10-18): once a desk is taken off, or an invitation is let go
   for any reason, no team file the lead writes afterwards is sealed under that invitation's key. Three desks ask by relay
   invitations and are admitted while offline, so each invitation is spent and its desk has not read its wrap; then
   (b) one is taken off by an epoch move Studio's removal did not mark, as a removal from before this fix left it, (a) one by
   Studio's own removeMember with the mirror's watch firing on the new team file before the next sync, and (c) the third
   stays on the team past its invitation's end. */
LEGS.rs11 = async () => {
  const S = await import("../src/studio.mjs");
  const world = await relayWorld(), lab = labDir("relay-rs11");
  const s = await studioLead(world, lab);
  const proj = (await S.newProject(path.join(lab, "projects"), "Harbour lamps", [{ code: "en", name: "English" }])).dir;
  S.setPublishFolder(proj, s.mirror);
  const sync = async () => { for (let i = 0; i < 2; i++) { await s.runner.sync(); await s.runner.idle(); } };
  const seq = () => world.store(s.rt).get("seq") || 0;
  const target = { team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } };
  const J = Engine.joinRules(), I = Engine.inviteRules();
  async function asks(name) {
    const secret = newSecret(), ri = Relay.relayInvite(secret);
    const made = makeInvite(target, "Ada Quay", secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
    K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
    await sync();
    const N = deskKeys(), d = deskOf(world, lab, s, name, N, new Map(), { invite: () => ({ inv: ri.inv, token: ri.token, seal: ri.seal }) });
    const nonce = hex(32), commit = J.joinCommit(s.teamId, N.pub, N.box.pub, nonce);
    const req = { format: 1, kind: J.JOIN_KIND, team: s.teamId, desk: { id: N.keyId, key: N.pub, box: N.box.pub, name: "Desk " + name },
      date: new Date().toISOString(), commit, invite: { id: I.inviteIdOf(secret), proof: I.memberProof(secret, commit) } };
    req.sig = { alg: "Ed25519", keyId: N.keyId };
    req.sig.value = crypto.sign(null, J.joinSignedBytes(req), N.privateKey).toString("hex");
    put(d.mirror, "desks/" + N.keyId + "/join.json", JSON.stringify(req, null, 1) + "\n");
    d.ch.start(); await settle(d.ch);
    d.t.down = true; await d.ch.stop();
    return { N, d, ri, id: made.id };
  }
  /* Every blob the relay is handed from here on, as it was handed, and its bytes: a copy the relay supersedes later still
     reached anyone who fetched it in between. */
  await sync();
  const kept = new Map(), bytes = new Map(), st0 = world.store(s.rt), put0 = st0.put.bind(st0), objs = world.R.bucket.objects;
  st0.put = (k, v) => { if (String(k).startsWith("blob:") && v && !kept.has(v.id)) kept.set(v.id, JSON.parse(JSON.stringify(v))); return put0(k, v); };
  objs.set = (k, v) => { bytes.set(k, Buffer.from(v)); return Map.prototype.set.call(objs, k, v); };
  const opensUnder = (key, v) => opensWith(world, s.rt, key, v, bytes.get(v.obj));
  const R1 = await asks("r1"), R2 = await asks("r2"), R3 = await asks("r3");
  await sync();
  const r = await S.watchAdmit(s.mirror, s.keyAt, labSecret(s.keyAt), { auto: false, teamKeys: K.teamKeysOf(s.teamsFile, s.vault),
    invites: K.inviteBookOf(s.teamsFile, s.vault), teamsFile: s.teamsFile });
  for (const x of r.spent || []) K.endInvite(s.teamsFile, s.teamId, x.invite, "spent", x.desk);
  await sync();
  const inv = (R) => K.relayInvitesOf(s.teamsFile, s.vault, s.teamId, Date.now()).find((i) => i.id === R.id);
  const before = [R1, R2, R3].every((R) => { const i = inv(R); return !!i && i.state === "spent" && !i.gone; });
  /* The positive control: what is kept under an invitation's key before any removal opens under it, so a "nothing opens"
     below is the key's, not the opener's. */
  const placed = (R) => Array.from(kept.values()).filter((v) => v.place === "invite:" + R.ri.inv);
  const control = placed(R1).some((v) => { const f = opensUnder(R1.ri.seal, v); return !!f && f.kind === "file" && f.path === world.C.TEAM_NAME; });
  /* What a removed desk could open of what the lead kept after its removal: under its invitation's key, or under any team key
     it could hold. */
  const opened = (R, from, keys) => Array.from(kept.values()).filter((v) => v.seq > from)
    .filter((v) => keys.concat([ownCopy(R)]).some((key) => { const f = opensUnder(key, v); return !!f && f.kind === "file"; })).length;
  /* The removed desk's own copy key (F1), by the agreement of its box with the lead's. */
  const leadBox = Relay.leadOpened(s.keyAt, labSecret(s.keyAt)).box.public;
  const ownCopy = (R) => { const c = world.C.deskCopyOf(agreeWith(R.N.box)(leadBox), { rt: s.rt, teamId: s.teamId, leadKeyId: s.lead.keyId,
    leadBox, deskId: R.N.keyId, deskBox: R.N.box.pub }); return c ? c.key : null; };
  const refreshed = (R, from) => placed(R).filter((v) => v.seq > from && !v.del).length;
  const lastIsDrop = (R) => { const v = placed(R).sort((a, b) => b.seq - a.seq)[0]; return !!v && v.del === true; };
  const keysUpTo = (epoch) => Object.entries(K.teamKeysOf(s.teamsFile, s.vault)[s.teamId] || {}).filter(([e]) => Number(e) < epoch).map(([, k]) => k);

  /* (b) R2 taken off by an epoch move nobody marked. */
  const h = await heldTeam(s.mirror, { key: s.keyAt });
  const next = await newEpoch(h.team, { key: s.keyAt, remove: R2.N.keyId, secret: labSecret(s.keyAt) });
  await writeTeam(s.mirror, next.team, { key: s.keyAt, passphrase: labSecret(s.keyAt) });
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, next.team.epoch, next.teamKey);
  const seqB = seq();
  await sync();
  const b = { refreshed: refreshed(R2, seqB), opened: opened(R2, seqB, [R2.ri.seal].concat(keysUpTo(next.team.epoch))), drop: lastIsDrop(R2), gone: !!inv(R2) && inv(R2).gone };

  /* (a) R1 taken off by Studio's own removal, the shell's marks after it as studio:member-remove makes them, and the mirror's
     watch firing on the new team file before the next sync. */
  const seqA = seq();
  const rm = await S.removeMember(proj, s.keyAt, s.teamId, R1.N.keyId, labSecret(s.keyAt), { confirm: true, teamKeys: K.teamKeysOf(s.teamsFile, s.vault),
    invites: K.inviteBookOf(s.teamsFile, s.vault), teamsFile: s.teamsFile });
  if (rm.endedInvite) K.endInvite(s.teamsFile, s.teamId, rm.endedInvite, "spent", rm.removed);
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, rm.team.epoch, Buffer.from(rm.teamKey));
  s.chan().kick(); await s.chan().idle();
  put(s.mirror, "after-removal.ec", "{\"kind\":\"etiuda-sealed\",\"note\":\"written after the removal\"}\n");
  await sync();
  const a = { refreshed: refreshed(R1, seqA), opened: opened(R1, seqA, [R1.ri.seal].concat(keysUpTo(rm.team.epoch))), drop: lastIsDrop(R1), gone: !!inv(R1) && inv(R1).gone };

  /* (c) R3 still on the team, its invitation past its end: let go, its copy superseded. */
  const DAY = 24 * 60 * 60 * 1000, later = Date.now() + 8 * DAY;
  s.setClock(later); world.R.clock.now = later;
  const seqC = seq();
  await sync();
  const c3 = K.relayInvitesOf(s.teamsFile, s.vault, s.teamId, later).find((i) => i.id === R3.id);
  const c = { refreshed: refreshed(R3, seqC), drop: lastIsDrop(R3), gone: !!c3 && c3.gone && c3.dropped };
  const line = (x) => "refreshed " + x.refreshed + (x.opened !== undefined ? ", opens " + x.opened : "") + ", superseded " + x.drop + ", let go " + x.gone;
  check(before && control && r.admitted && r.admitted.length === 3 && rm.removed === R1.N.keyId
    && b.refreshed === 0 && b.opened === 0 && b.drop && b.gone && a.refreshed === 0 && a.opened === 0 && a.drop && a.gone
    && c.refreshed === 0 && c.drop && c.gone,
    "rs11 N1: a spent invitation's copy is let go once its desk is off the team or the invitation is past its end, and the removed desk"
    + " opens nothing written after its removal (three admitted while offline " + before + ", the opener's control " + control + "): taken off"
    + " by an unmarked epoch move: " + line(b) + "; by Studio's removal, the watch first: " + line(a) + "; past its end: " + line(c));
  await s.runner.stop();
};

/* The shell's own triggers (the test architect's condition 5 of 2026-10-18): every leg above builds the runner with the watch
   off and syncs by hand. Here it is built as shell/main.js builds it, with the same seven options and nothing else, so the
   layer's defaults stand (the mirror's watch on, its poll timer); it is synced once, as the shell syncs at launch, and never
   again. A project is published into the mirror by Studio's own publishProject, and the edition must reach a desk of the
   team with no call into the runner after the publish. */
LEGS.rs12 = async () => {
  const S = await import("../src/studio.mjs");
  const world = await relayWorld(), lab = labDir("relay-rs12");
  const ud = path.join(lab, "studio-ud");
  fs.mkdirSync(ud, { recursive: true });
  const keyAt = path.join(ud, "studio-key.json");
  const lead = await labLeadKey();
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  granted(keyAt, lead.public);
  const teamsFile = K.teamsFile(ud), vault = makeVault();
  const teamId = "t-" + hex(8), rt = Relay.relayId(), teamKey = crypto.randomBytes(32);
  K.keepTeamKey(teamsFile, vault, teamId, 1, teamKey);
  const mirror = K.keepRelay(teamsFile, teamId, rt, Relay.RELAY_URL);
  fs.mkdirSync(mirror, { recursive: true });
  const proj = (await S.newProject(path.join(lab, "projects"), "Lantern Quay", [{ code: "en", name: "English" }])).dir;
  const shelf = (await S.addTag(proj, "shelf", { en: "Openers" })).tag.id;
  const card = (await S.addCard(proj, shelf, "Warm opening", "Good day, and welcome to Lantern Quay.")).card.id;
  S.setPublishFolder(proj, mirror);
  await olderFolderTeam(proj, { relay: true, key: keyAt, passphrase: labSecret(keyAt), teamId, teamKeys: K.teamKeysOf(teamsFile, vault) });
  const X = deskKeys();
  let team = withDesk((await heldTeam(mirror, { key: keyAt })).team, { id: X.keyId, key: X.pub, box: X.box.pub });
  team.roster.find((e) => e.desk.id === X.keyId).wrap = Engine.hpkeRules().wrapTeamKey(teamKey, X.box.pub, teamId, 1, X.keyId);
  await writeTeam(mirror, withChannel(team, { kind: "relay", rt, url: Relay.RELAY_URL }, RING), { key: keyAt, passphrase: labSecret(keyAt) });
  const publish = (notes, now) => S.publishProject(proj, { folder: mirror, notes, now, leadKey: keyAt, teamKeys: K.teamKeysOf(teamsFile, vault),
    key: keyAt, passphrase: labSecret(keyAt), ...LIC });
  const pub1 = await publish("Edition one.", "2026-10-18T07:00:00.000Z");
  const t = world.transport("studio"), lines = [];
  const runner = trackRunner({ roots: GRANT_ROOTS, teamsFile, vault, keyFile: keyAt, secret: () => labSecret(keyAt), request: t.request, connect: t.connect,
    say: (l) => lines.push(l) });
  await runner.sync();
  const eds = () => { try { return fs.readdirSync(mirror).filter((n) => /\.ec$/i.test(n)).sort(); } catch { return []; } };
  const s = { rt, teamId, lead: { keyId: lead.keyId, public: lead.public } };
  const desk = deskOf(world, lab, s, "desk", X, new Map([[1, teamKey]]));
  desk.ch.start();
  const same = () => { const n = eds(); return n.length > 0 && n.every((f) => read(desk.mirror, f) === read(mirror, f)); };
  const first = await until(same, 20000);
  const before = eds().map((f) => read(mirror, f)).join("\n");
  await S.saveCard(proj, card, { body: { en: "Good day, and welcome to Lantern Quay. The lamps are lit at dusk." } });
  const pub2 = await publish("Edition two.", "2026-10-18T08:00:00.000Z");
  const moved = eds().map((f) => read(mirror, f)).join("\n") !== before;
  const sinceAt = Date.now();
  const second = moved && await until(same, 20000);
  const took = Date.now() - sinceAt;
  check(!!pub1 && !pub1.error && !!pub2 && !pub2.error && first && moved && second && world.foreign.length === 0,
    "rs12 the shell's own triggers: the runner built as shell/main.js builds it (the layer's defaults, the mirror's watch on) and synced once,"
    + " as at launch; edition one reaches the desk " + first + "; edition two, published by publishProject into the mirror " + moved + ", reaches"
    + " the desk with no call into the runner after it " + second + (second ? " in " + took + " ms" : "") + "; calls elsewhere " + world.foreign.length);
  await desk.ch.stop(); await runner.stop();
};

/* ---- slice 2, desk to lead: Studio reads the mirror as a share (board 900) ------------------------------------------- */

/* A desk file sealed for the team, the text the channel writes into the mirror. */
function sealFor(teamKey, teamId, epoch, inner) {
  return JSON.stringify(Engine.sealRules().sealCatalog(teamKey, teamId, epoch, JSON.stringify(inner))) + "\n";
}
/* An in-use file this Studio's listUses names, signed by the desk whose folder it sits in. */
function inUseDoc(desk, cat) {
  const doc = {
    format: 1, kind: "etiuda-in-use",
    desk: { id: desk.keyId, key: desk.pub, box: desk.box.pub, name: "Quay desk" },
    at: "2026-10-18T09:00:00.000Z",
    catalog: cat,
    sig: { alg: "Ed25519", keyId: desk.keyId },
  };
  doc.sig.value = crypto.sign(null, Engine.deskRules().branchSignedBytes(doc), desk.privateKey).toString("hex");
  return doc;
}
/* The statistics body the roster's key signs, the shape statsFor counts. */
function statsBody(desk, n) {
  const obj = {
    format: 1, kind: "etiuda-desk-stats", desk: "Quay desk", engine: "test",
    period: { from: "2026-10-01", to: "2026-10-07" }, sync: "2026-10-07 09:00",
    cards: [{ id: "c-quay", n: n, at: "2026-10-03" }],
    intents: [], misses: 0, langs: { en: 1 }, since: "2026-10-01", pairs: [],
    catalog: { id: "quay-lamps", rev: 1 }, hash: "h-quay",
  };
  const out = Object.assign({}, obj, { sig: { alg: "Ed25519", keyId: desk.keyId } });
  out.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(out), desk.privateKey).toString("hex");
  return out;
}
function statsText(s, desk, body) {
  /* As the desk seals: to the team file's statistics box, else to the lead's box (the engine's statsSeal). */
  const env = Engine.statsRules().sealStatsLead(s.team.lead.stats || s.team.lead.box, s.team.id, s.lead.keyId, desk.keyId, JSON.stringify(body));
  return JSON.stringify(env) + "\n";
}
const twice = async (s) => { for (let i = 0; i < 2; i++) { await s.runner.sync(); await s.runner.idle(); } };
/* A published catalog of one card, and a desk's own edit of it, the shape the review queue reads. */
async function quayEdition(lab, folder) {
  const S = await import("../src/studio.mjs");
  const { ARCHIVE, CATALOG_IN_ARCHIVE, editionsIn } = await import("../src/publish.mjs");
  const src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8");
  const E = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64") + "#rs2");
  const made = await S.newProject(path.join(lab, "projects"), "Quay lamps", [{ code: "en", name: "English" }]);
  const shelf = (await S.addTag(made.dir, "shelf", { en: "General" })).tag.id;
  const card = (await S.addCard(made.dir, shelf, "Lamp hours", "The lamps are lit at dusk.")).card.id;
  /* The edition is published aside and the project then pointed at `folder`: a catalog the team does not list goes out in the clear
     into no sealed team's place (board 962 stage 6, U1, src/publish.mjs clearRefused), and these legs read only its archived edition
     and the desks' files at `folder`. */
  const aside = path.join(lab, "quay-edition-aside");
  fs.mkdirSync(aside, { recursive: true });
  await S.setPublishFolder(made.dir, aside);
  await S.publishProject(made.dir, { folder: aside, notes: "Edition 1.", now: "2026-10-18T09:00:00.000Z", ...LIC });
  await S.setPublishFolder(made.dir, folder);
  const eds = editionsIn(made.dir);
  const from = JSON.parse(fs.readFileSync(path.join(made.dir, ARCHIVE, eds[eds.length - 1], CATALOG_IN_ARCHIVE), "utf8"));
  const F = await Engine.format(), V = Engine.sigRules();
  const branch = (desk, words) => {
    const doc = JSON.parse(JSON.stringify(E.catalogToV2(E.catalogFromV2(JSON.parse(JSON.stringify(from))))));
    doc.cards.find((c) => c.id === card).body.en = words;
    doc.id = desk.keyId + "-" + sha(Buffer.from(String(from.id))).slice(0, 8);
    doc.rev = 2; doc.date = "2026-10-18"; doc.modified = true;
    doc.grew = { id: String(from.id), rev: Number(from.rev), sha: "sha256:" + sha(Buffer.from(V.v2SignedBytes(from))) };
    doc.desk = { id: desk.keyId, key: desk.pub, box: desk.box.pub, name: "Quay desk" };
    delete doc.hash; delete doc.sig;
    doc.hash = F.contentHash(doc);
    doc.sig = { alg: "Ed25519", keyId: desk.keyId };
    doc.sig.value = crypto.sign(null, Buffer.concat([Buffer.from("etiuda-desk-branch\n", "utf8"), Buffer.from(V.v2SignedBytes(doc))]),
      desk.privateKey).toString("hex");
    return JSON.stringify(doc, null, 1) + "\n";
  };
  return { S, made, from, card, branch };
}

LEGS.rs2u = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs2u");
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true });
  await twice(s);
  const Use = await import("../src/catalog-use.mjs");
  const { folderStamp } = await import("../src/team-watch.mjs");
  fs.mkdirSync(path.join(s.mirror, "desks", D.keyId), { recursive: true });
  let seen = false;
  const watch = Use.watchFolder(s.mirror, () => { seen = true; }, { settle: 40 });
  const before = folderStamp(s.mirror, new Map());
  const cat = { id: "quay-lamps", rev: 1, sha256: "sha256:" + "ab".repeat(32), title: "Quay lamps", signer: "lead", source: "file" };
  const rel = "desks/" + D.keyId + "/in-use.ec";
  const held = new Map([[1, s.teamKey]]);
  const desk = deskOf(world, lab, s, "desk", D, held);
  desk.ch.start(); await settle(desk.ch);
  put(desk.mirror, rel, sealFor(s.teamKey, s.teamId, 1, inUseDoc(D, cat)));
  await settle(desk.ch); await twice(s);
  const row = Use.listUses({ folder: s.mirror, roster: [{ id: D.keyId, name: "Quay desk" }], projectId: "other-catalog",
    editions: [], teamKeys: { [s.teamId]: { 1: s.teamKey } } }).find((r) => r.id === D.keyId);
  const named = !!row && row.kind === "other" && row.title === "Quay lamps" && row.unread !== true;
  const stamped = await until(() => folderStamp(s.mirror, new Map()) !== before, 25000);
  const watched = await until(() => seen, 25000);
  watch.close();
  check(named && stamped && watched,
    "rs2u a desk's in-use file written through the channel is named from the mirror as from a share: title "
    + (row && row.title) + " kind " + (row && row.kind) + " unread " + (row ? row.unread : "no row")
    + "; the desks watch sees it " + stamped + "; watchFolder sees it " + watched);
  await s.runner.stop(); await desk.ch.stop();
};

LEGS.rs2a = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs2a");
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true });
  await twice(s);
  const quay = await quayEdition(lab, s.mirror);
  const pin = Engine.deskRules().signedSha(quay.from);
  const open = unlockKey(readKeyFile(s.keyAt), labSecret(s.keyAt));
  const lead = { keyId: open.keyId, public: open.public, privateKey: open.privateKey };
  const Use = await import("../src/catalog-use.mjs");
  const ask2a = Use.buildAsk({ desk: D.keyId, sha256: pin, lead });
  Use.writeAsk(s.mirror, D.keyId, ask2a);
  const rel = "desks/" + D.keyId + "/catalog-answer.ec";
  const inner = signedAnswer(D, ask2a.id, s.teamId, pin, quay.from);
  const desk = deskOf(world, lab, s, "desk", D, new Map([[1, s.teamKey]]));
  desk.ch.start(); await settle(desk.ch);
  put(desk.mirror, rel, sealFor(s.teamKey, s.teamId, 1, inner));
  await settle(desk.ch); await twice(s);
  const due = Use.answersDue(s.mirror, { [s.teamId]: { 1: s.teamKey } }, {}, { lead, roster: [D.keyId], team: s.teamId, epoch: 1,
    catalogs: [String(quay.from.id)], content: null, deskKeys: { [D.keyId]: D.pub } });
  let landed = null, landErr = "";
  try {
    landed = due[0] ? await quay.S.landCatalog(path.join(lab, "brought"), due[0].catalog, path.join(lab, "temp"),
      { title: due[0].title || "Quay lamps", desk: "Quay desk", lang: "en" }) : null;
  } catch (e) { landErr = String(e && e.message || e); }
  const imported = !!landed && !!landed.dir && fs.existsSync(landed.dir);
  check(due.length === 1 && due[0].sha256 === pin && imported,
    "rs2a a desk's answer written through the channel is imported from the mirror as from a share: due " + due.length
    + ", pin " + (due[0] && due[0].sha256 === pin) + ", project " + imported + (landErr ? " (" + landErr + ")" : ""));
  await s.runner.stop(); await desk.ch.stop();
};

LEGS.rs2t = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs2t");
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true });
  await twice(s);
  const S = await import("../src/studio.mjs");
  const proj = (await S.newProject(path.join(lab, "projects"), "Quay lamps", [{ code: "en", name: "English" }])).dir;
  S.setPublishFolder(proj, s.mirror);
  const rel = "desks/" + D.keyId + "/stats.estat";
  const desk = deskOf(world, lab, s, "desk", D, new Map([[1, s.teamKey]]));
  desk.ch.start(); await settle(desk.ch);
  put(desk.mirror, rel, statsText(s, D, statsBody(D, 4)));
  await settle(desk.ch); await twice(s);
  const opts = { key: s.keyAt, passphrase: labSecret(s.keyAt) };
  const got = await S.statsFor(proj, opts);
  const counted = got.live && got.live.n === 1 && (got.rows || []).length === 1;
  const other = deskKeys();
  const forged = statsBody(D, 4);
  forged.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(forged), other.privateKey).toString("hex");
  put(s.mirror, rel, statsText(s, D, forged));
  const stranger = await S.statsFor(proj, opts);
  const notCounted = stranger.live && stranger.live.n === 0 && (stranger.rows || []).length === 0;
  check(!!s.team.lead.box && counted && notCounted,
    "rs2t a desk's statistics written through the channel are counted from the mirror under the roster's key: live "
    + (got.live && got.live.n) + " rows " + (got.rows || []).length + " (refusal " + got.refusal + "); a file signed by another key is not counted, live "
    + (stranger.live && stranger.live.n) + " rows " + (stranger.rows || []).length + ")");
  await s.runner.stop(); await desk.ch.stop();
};

LEGS.rs2e = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs2e");
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true });
  await twice(s);
  const quay = await quayEdition(lab, s.mirror);
  const rel = "desks/" + D.keyId + "/quay-lamps.ec";
  const text = quay.branch(D, "The lamps are lit at dusk, and again at four.");
  const desk = deskOf(world, lab, s, "desk", D, new Map([[1, s.teamKey]]));
  desk.ch.start(); await settle(desk.ch);
  put(desk.mirror, rel, text);
  await settle(desk.ch); await twice(s);
  const row = (await quay.S.listProposals(quay.made.dir)).proposals.find((p) => String(p.file).split(path.sep).join("/").endsWith(rel));
  check(read(s.mirror, rel) === text && !!row && row.ok && !row.removed,
    "rs2e a desk's own edit written through the channel is a review row read from the mirror as from a share: arrived "
    + (read(s.mirror, rel) === text) + ", row " + !!(row && row.ok));
  await s.runner.stop(); await desk.ch.stop();
};

LEGS.rs2d = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs2d");
  const lines = [];
  const D = deskKeys(), other = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true, say: (l) => lines.push(l) });
  const sync = async () => { await twice(s); };
  await sync();
  const rel = "desks/" + D.keyId + "/in-use.ec";
  const desk = deskOf(world, lab, s, "desk", D, new Map([[1, s.teamKey]]));
  desk.ch.start(); await settle(desk.ch);
  const cat = { id: "quay-lamps", rev: 1, sha256: "sha256:" + "ab".repeat(32), title: "Quay lamps", signer: "lead", source: "file" };
  put(desk.mirror, rel, sealFor(s.teamKey, s.teamId, 1, inUseDoc(D, cat)));
  await settle(desk.ch); await sync();
  const first = world.blobsBy(s.rt, D.keyId).filter((b) => !b.del);
  const stash = first.length ? world.recordOf(s.rt, first[0].id) : null;
  const cat2 = Object.assign({}, cat, { rev: 2, title: "Quay lamps, later" });
  put(desk.mirror, rel, sealFor(s.teamKey, s.teamId, 1, inUseDoc(D, cat2)));
  await settle(desk.ch); await sync();
  const kept = read(s.mirror, rel);
  world.store(s.rt).del("tomb:" + stash.rec.id);
  world.inject(s.rt, Object.assign({}, stash.rec), stash.ct);
  await sync();
  const replayKept = read(s.mirror, rel) === kept;
  const replaySaid = lines.some((l) => l.indexOf(world.B.REASONS["replay-counter"]) >= 0);
  const misplaced = "desks/" + other.keyId + "/in-use.ec";
  const rec = JSON.parse(fs.readFileSync(s.mirror + ".json", "utf8")).applied[rel];
  const bad = world.B.seal({ relayTeamId: s.rt, epoch: 1, teamKey: s.teamKey, writer: { keyId: D.keyId, privateKey: D.privateKey },
    path: misplaced, body: "{\"misplaced\":1}\n", counter: rec.counter + 1, place: "desk:" + D.keyId, kind: "file" });
  world.inject(s.rt, { id: bad.id, supersedes: null, epoch: 1, writer: D.keyId, counter: bad.counter, del: false, sig: bad.signature,
    nonce: bad.nonce, place: "desk:" + D.keyId }, bad.ciphertext);
  await sync();
  const misplacedKept = read(s.mirror, misplaced) === null;
  const misplacedSaid = lines.some((l) => l.indexOf(world.B.REASONS["outside-place"]) >= 0);
  const h = await heldTeam(s.mirror, { key: s.keyAt });
  const next = await newEpoch(h.team, { key: s.keyAt, remove: D.keyId, secret: labSecret(s.keyAt) });
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, next.team.epoch, next.teamKey);
  await writeTeam(s.mirror, next.team, { key: s.keyAt, passphrase: labSecret(s.keyAt) });
  await sync();
  const goneBody = "{\"note\":\"sent after the removal\"}\n";
  const gone = world.B.seal({ relayTeamId: s.rt, epoch: 1, teamKey: s.teamKey, writer: { keyId: D.keyId, privateKey: D.privateKey },
    path: rel, body: goneBody, counter: rec.counter + 2, place: "desk:" + D.keyId, kind: "file" });
  world.inject(s.rt, { id: gone.id, supersedes: null, epoch: 1, writer: D.keyId, counter: gone.counter, del: false, sig: gone.signature,
    nonce: gone.nonce, place: "desk:" + D.keyId }, gone.ciphertext);
  await sync();
  const removedKept = read(s.mirror, rel) !== goneBody && read(s.mirror, rel) === kept;
  const removedSaid = lines.some((l) => l.indexOf(world.B.REASONS.removed) >= 0);
  const Use = await import("../src/catalog-use.mjs");
  const shown = Use.listUses({ folder: s.mirror, roster: [], projectId: "other", editions: [], teamKeys: { [s.teamId]: { 1: s.teamKey } } });
  const open = unlockKey(readKeyFile(s.keyAt), labSecret(s.keyAt));
  const lead = { keyId: open.keyId, public: open.public, privateKey: open.privateKey };
  const ansCat = { format: 2, id: "quay-lamps", rev: 1, name: "Quay lamps", cards: [{ id: "c-lamp" }] };
  const pin = Engine.deskRules().signedSha(ansCat);
  const ask2d = Use.buildAsk({ desk: D.keyId, sha256: pin, lead });
  const ans = signedAnswer(D, ask2d.id, s.teamId, pin, ansCat);
  const env1 = sealFor(s.teamKey, s.teamId, 1, ans), env2 = sealFor(s.teamKey, s.teamId, 1, ans);
  const ansRel = "desks/" + D.keyId + "/catalog-answer.ec";
  put(s.mirror, ansRel, env1);
  Use.writeAsk(s.mirror, D.keyId, ask2d);
  const judged2d = { team: s.teamId, epoch: next.team.epoch, catalogs: ["quay-lamps"], content: null, deskKeys: {} };
  const removedRec = { [D.keyId]: { key: D.pub, at: Date.now(), epoch: next.team.epoch, files: { [ansRel]: sha(Buffer.from(env1, "utf8")) } } };
  const keys = { [s.teamId]: { 1: s.teamKey, 2: next.teamKey } };
  const snapshotDue = Use.answersDue(s.mirror, keys, {}, Object.assign({ lead, roster: [], removed: removedRec }, judged2d)).length;
  put(s.mirror, ansRel, env2);
  const laterDue = Use.answersDue(s.mirror, keys, {}, Object.assign({ lead, roster: [], removed: removedRec }, judged2d)).length;
  const sealsDiffer = sha(Buffer.from(env1, "utf8")) !== sha(Buffer.from(env2, "utf8"));
  check(replayKept && replaySaid && misplacedKept && misplacedSaid && removedKept && removedSaid && shown.length === 0
    && sealsDiffer && snapshotDue === 1 && laterDue === 0,
    "rs2d a replayed file is dropped and said " + replaySaid + " (newer kept " + replayKept + "); a misplaced file is dropped and said "
    + misplacedSaid + " (absent " + misplacedKept + "); a removed desk's file is dropped and said " + removedSaid + " (kept the earlier "
    + removedKept + "); the loaded roster no longer shows the desk " + (shown.length === 0) + "; an answer stored while trusted is still owed "
    + (snapshotDue === 1) + " and one sealed again after is not " + (laterDue === 0) + " (seals differ " + sealsDiffer + ")");
  await s.runner.stop(); await desk.ch.stop();
};

/* Board 911: one catch-up of the mirror, waited out, before an epoch move that drops a desk. */
const CATCH_UP_EN = "Studio is offline, so the statistics may leave out what this teammate sent since Studio last caught up with it.";
const CATCH_UP_PL = "Studio nie ma połączenia, więc w statystykach może zabraknąć tego, co przyszło od tego członka zespołu, odkąd Studio ostatnio pobrało jego dane.";
LEGS.rs911 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs911");
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true });
  await twice(s);
  const rel = "desks/" + D.keyId + "/in-use.ec";
  const body = "{\"note\":\"stored while trusted\"}\n";
  const desk = deskOf(world, lab, s, "desk", D, new Map([[1, s.teamKey]]));
  desk.ch.start(); await settle(desk.ch);
  put(desk.mirror, rel, body);
  await settle(desk.ch);
  const absent = read(s.mirror, rel) === null;
  const up = await Relay.catchUpBeforeMove(s.runner, s.teamId);
  const taken = absent && up && up.ok === true && up.offline === false && read(s.mirror, rel) === body;
  const h = await heldTeam(s.mirror, { key: s.keyAt });
  const next = await newEpoch(h.team, { key: s.keyAt, remove: D.keyId, secret: labSecret(s.keyAt) });
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, next.team.epoch, next.teamKey);
  await writeTeam(s.mirror, next.team, { key: s.keyAt, passphrase: labSecret(s.keyAt) });
  K.markRemoved(s.teamsFile, s.teamId, { id: D.keyId, key: D.pub }, Date.now(), next.team.epoch, deskSnapshot(s.mirror, D.keyId));
  const counted = (removedHeld(s.mirror, K.removedOf(s.teamsFile, s.teamId))[D.keyId] || {})[rel] === sha(Buffer.from(body, "utf8"));
  const rec = JSON.parse(fs.readFileSync(s.mirror + ".json", "utf8")).applied[rel];
  const later = "{\"note\":\"sent after the removal\"}\n";
  const gone = world.B.seal({ relayTeamId: s.rt, epoch: 1, teamKey: s.teamKey, writer: { keyId: D.keyId, privateKey: D.privateKey },
    path: rel, body: later, counter: rec.counter + 1, place: "desk:" + D.keyId, kind: "file" });
  world.inject(s.rt, { id: gone.id, supersedes: null, epoch: 1, writer: D.keyId, counter: gone.counter, del: false, sig: gone.signature,
    nonce: gone.nonce, place: "desk:" + D.keyId }, gone.ciphertext);
  await twice(s);
  const keptAfter = read(s.mirror, rel) === body;
  const E = deskKeys();
  const labB = labDir("relay-rs911-off");
  const b = await studioLead(world, labB, { roster: [E], wraps: true });
  await twice(b);
  const relB = "desks/" + E.keyId + "/in-use.ec";
  const late = "{\"note\":\"sent while the lead was offline\"}\n";
  const deskB = deskOf(world, labB, b, "off", E, new Map([[1, b.teamKey]]));
  deskB.ch.start(); await settle(deskB.ch);
  put(deskB.mirror, relB, late);
  await settle(deskB.ch);
  b.t.down = true;
  const down = await Relay.catchUpBeforeMove(b.runner, b.teamId);
  const missed = read(b.mirror, relB) === null;
  const said = !!down && down.offline === true && down.said === CATCH_UP_EN && down.saidPl === CATCH_UP_PL;
  const hb = await heldTeam(b.mirror, { key: b.keyAt });
  const nextB = await newEpoch(hb.team, { key: b.keyAt, remove: E.keyId, secret: labSecret(b.keyAt) });
  K.keepTeamKey(b.teamsFile, b.vault, b.teamId, nextB.team.epoch, nextB.teamKey);
  await writeTeam(b.mirror, nextB.team, { key: b.keyAt, passphrase: labSecret(b.keyAt) });
  const moved = nextB.team.epoch >= 2 && !(nextB.team.roster || []).some((e) => e && e.desk && e.desk.id === E.keyId);
  K.markRemoved(b.teamsFile, b.teamId, { id: E.keyId, key: E.pub }, Date.now(), nextB.team.epoch, deskSnapshot(b.mirror, E.keyId));
  const notCounted = !((removedHeld(b.mirror, K.removedOf(b.teamsFile, b.teamId))[E.keyId] || {})[relB]);
  const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const from = shell.indexOf("answer(\"studio:member-remove\"");
  const handler = shell.slice(from, shell.indexOf("answer(\"studio:", from + 30));
  const ordered = handler.indexOf("catchUpBeforeMove") >= 0 && handler.indexOf("catchUpBeforeMove") < handler.indexOf("thread.call(\"removeMember\"");
  const { loadPage } = await import("./page-stand-in.mjs");
  const paintRemoval = async (lang) => {
    const home = loadPage({ api: { memberRemove: async () => ({ removed: true, folder: "C:/quay", file: "ours", requests: [],
      catchUpSaid: CATCH_UP_EN, team: { id: "t-quay", epoch: 2, relay: true, roster: [], sealed: true } }) }, uiLang: lang });
    const P = home.page;
    Object.assign(P.S, { open: { dir: "C:/quay", draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [],
      project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
      host: { tour: { offered: true } },
      screen: "projects", home: "team", teamDir: "C:/quay", cover: "team", teamWant: "remove",
      memberGoing: D.keyId, err: null, dkNote: null, q: "",
      desks: { team: { id: "t-quay", epoch: 1, relay: true, roster: [{ id: D.keyId, name: "Quay desk" }], sealed: true },
        folder: "C:/quay", requests: [], file: "ours" } });
    await P.ACTS["do-member-remove"]();
    return home.node("#main").innerHTML;
  };
  const en = await paintRemoval("en"), pl = await paintRemoval("pl");
  const painted = en.indexOf(CATCH_UP_EN) >= 0 && pl.indexOf(CATCH_UP_PL) >= 0 && pl.indexOf(CATCH_UP_EN) < 0;
  /* A session still held while the relay answers 503 is not a catch-up that finished (F-omega1). The move goes
     ahead, the file the desk stored while trusted is not in the mirror and is not counted, and the lead is told. */
  const heldAnswer = async (label, which) => {
    const H = deskKeys();
    const labH = labDir("relay-rs911-" + label);
    const h = await studioLead(world, labH, { roster: [H], wraps: true });
    await twice(h);
    const relH = "desks/" + H.keyId + "/in-use.ec";
    const bodyH = "{\"note\":\"stored while trusted, " + label + " held\"}\n";
    const deskH = deskOf(world, labH, h, "held-" + label, H, new Map([[1, h.teamKey]]));
    try {
      deskH.ch.start(); await settle(deskH.ch);
      put(deskH.mirror, relH, bodyH);
      await settle(deskH.ch);
      const absent = read(h.mirror, relH) === null;
      h.t.answer = (method, url) => {
        const u = String(url);
        const list = which === "list" && method === "GET" && /\/since\/\d+$/.test(u);
        const blob = which === "blob" && method === "GET" && /\/b\/[0-9a-f]{32}$/.test(u);
        if (!list && !blob) return null;
        return { status: 503, header: () => null, bytes: Buffer.from("{\"error\":\"busy\"}") };
      };
      const up = await Relay.catchUpBeforeMove(h.runner, h.teamId);
      const missedH = read(h.mirror, relH) === null;
      const told = !!up && up.ok === false && up.offline === true && up.said === CATCH_UP_EN && up.saidPl === CATCH_UP_PL;
      /* Stop while the hold is still on, so a late cycle cannot fetch the file before the snapshot. */
      await h.runner.stop(); await deskH.ch.stop();
      h.t.answer = null;
      const held = await heldTeam(h.mirror, { key: h.keyAt });
      const nextH = await newEpoch(held.team, { key: h.keyAt, remove: H.keyId, secret: labSecret(h.keyAt) });
      K.keepTeamKey(h.teamsFile, h.vault, h.teamId, nextH.team.epoch, nextH.teamKey);
      await writeTeam(h.mirror, nextH.team, { key: h.keyAt, passphrase: labSecret(h.keyAt) });
      const movedH = nextH.team.epoch >= 2 && !(nextH.team.roster || []).some((e) => e && e.desk && e.desk.id === H.keyId);
      K.markRemoved(h.teamsFile, h.teamId, { id: H.keyId, key: H.pub }, Date.now(), nextH.team.epoch, deskSnapshot(h.mirror, H.keyId));
      const notCountedH = !((removedHeld(h.mirror, K.removedOf(h.teamsFile, h.teamId))[H.keyId] || {})[relH]);
      return { absent, missed: missedH, told, moved: movedH, notCounted: notCountedH };
    } finally {
      h.t.answer = null;
      await h.runner.stop(); await deskH.ch.stop();
    }
  };
  const listHeld = await heldAnswer("list", "list");
  const blobHeld = await heldAnswer("blob", "blob");
  const heldOk = listHeld.absent && listHeld.missed && listHeld.told && listHeld.moved && listHeld.notCounted
    && blobHeld.absent && blobHeld.missed && blobHeld.told && blobHeld.moved && blobHeld.notCounted;
  /* The first GET of the listed blob answers 401 and the retry is let through. The channel reopens the session and
     fetches the blob; that catch-up finished, so there is no sentence. */
  const H401 = deskKeys();
  const lab401 = labDir("relay-rs911-401");
  const h401 = await studioLead(world, lab401, { roster: [H401], wraps: true });
  await twice(h401);
  const rel401 = "desks/" + H401.keyId + "/in-use.ec";
  const body401 = "{\"note\":\"stored while trusted, one refusal then served\"}\n";
  const desk401 = deskOf(world, lab401, h401, "once", H401, new Map([[1, h401.teamKey]]));
  let refused401 = 0, passed401 = 0, up401 = null, arrived401 = false;
  try {
    desk401.ch.start(); await settle(desk401.ch);
    put(desk401.mirror, rel401, body401);
    await settle(desk401.ch);
    h401.t.answer = (method, url) => {
      if (!(method === "GET" && /\/b\/[0-9a-f]{32}$/.test(String(url)))) return null;
      if (refused401 === 0) {
        refused401 += 1;
        return { status: 401, header: () => null, bytes: Buffer.from("{\"error\":\"lapsed\"}") };
      }
      passed401 += 1;
      return null;
    };
    up401 = await Relay.catchUpBeforeMove(h401.runner, h401.teamId);
    arrived401 = read(h401.mirror, rel401) === body401;
  } finally {
    h401.t.answer = null;
    await h401.runner.stop(); await desk401.ch.stop();
  }
  const retried = refused401 === 1 && passed401 >= 1 && arrived401 && !!up401 && up401.ok === true && up401.offline === false
    && !up401.said && !up401.saidPl;
  check(taken && counted && keptAfter && missed && said && moved && notCounted && ordered && painted && heldOk && retried,
    "rs911 before a move that drops a desk, one catch-up takes what it stored while trusted " + taken + " and that copy is counted "
    + counted + " (a later file stays out " + keptAfter + "); offline the move goes ahead " + moved + " and what was missed is not counted "
    + (missed && notCounted) + "; the lead is told, in English and in Polish, " + said + ", and the desks screen says it " + painted
    + "; the catch-up is before the removal " + ordered
    + "; a since list answered 503 is not a catch-up " + listHeld.told + " (absent " + listHeld.absent + ", missed " + listHeld.missed
    + ", move " + listHeld.moved + ", not counted " + listHeld.notCounted + ")"
    + "; a listed blob answered 503 is not a catch-up " + blobHeld.told + " (absent " + blobHeld.absent + ", missed " + blobHeld.missed
    + ", move " + blobHeld.moved + ", not counted " + blobHeld.notCounted + ")"
    + "; a listed blob answered 401, then let through, is a catch-up " + retried
    + " (ok " + !!(up401 && up401.ok === true) + ", no sentence " + !(up401 && (up401.said || up401.saidPl))
    + ", arrived " + arrived401 + ", first 401 " + (refused401 === 1) + ", retry let through " + (passed401 >= 1) + ")");
  /* Two files of one desk on one since page. The second blob is answered 503, so the catch-up did not finish. */
  const Htwo = deskKeys();
  const labTwo = labDir("relay-rs911-two");
  const htwo = await studioLead(world, labTwo, { roster: [Htwo], wraps: true });
  await twice(htwo);
  const deskTwo = deskOf(world, labTwo, htwo, "two", Htwo, new Map([[1, htwo.teamKey]]));
  let getsTwo = 0, upTwo = null;
  try {
    deskTwo.ch.start(); await settle(deskTwo.ch);
    put(deskTwo.mirror, "desks/" + Htwo.keyId + "/in-use.ec", "{\"note\":\"one\"}\n");
    put(deskTwo.mirror, "desks/" + Htwo.keyId + "/catalog-answer.ec", "{\"note\":\"two\"}\n");
    await settle(deskTwo.ch);
    htwo.t.answer = (method, url) => {
      if (method !== "GET" || !/\/b\/[0-9a-f]{32}$/.test(String(url))) return null;
      getsTwo += 1;
      if (getsTwo !== 2) return null;
      return { status: 503, header: () => null, bytes: Buffer.from("{\"error\":\"busy\"}") };
    };
    upTwo = await Relay.catchUpBeforeMove(htwo.runner, htwo.teamId);
  } finally {
    htwo.t.answer = null;
    await htwo.runner.stop(); await deskTwo.ch.stop();
  }
  const twoBusy = getsTwo >= 2 && !!upTwo && upTwo.ok === false && upTwo.offline === true;
  /* The 401 case above reopens the session between a blob and its retry, and that walker steps over the hello. This
     case reopens the session before the since page: the pinned channel keeps a session for 25 minutes, so a clock
     moved past that makes the catch-up's own index step past the hello and the session, and the catch-up still returns. */
  const Hre = deskKeys();
  const labRe = labDir("relay-rs911-reopen");
  const hre = await studioLead(world, labRe, { roster: [Hre], wraps: true });
  await twice(hre);
  const relRe = "desks/" + Hre.keyId + "/in-use.ec";
  const bodyRe = "{\"note\":\"stored while trusted, session reopened\"}\n";
  const deskRe = deskOf(world, labRe, hre, "reopen", Hre, new Map([[1, hre.teamKey]]));
  let upRe = null, arrivedRe = false, helloAt = -1, sessionAt = -1, sinceAt = -1;
  try {
    deskRe.ch.start(); await settle(deskRe.ch);
    put(deskRe.mirror, relRe, bodyRe);
    await settle(deskRe.ch);
    const mark = hre.t.log.length;
    hre.setClock(Date.now() + 26 * 60 * 1000);
    upRe = await Relay.catchUpBeforeMove(hre.runner, hre.teamId);
    const noted = hre.t.log.slice(mark);
    const at = (name) => noted.findIndex((line) => line === "POST " + name || (line.startsWith("POST ") && line.endsWith("/" + name)));
    helloAt = at("hello");
    sessionAt = at("session");
    sinceAt = noted.findIndex((line) => /^GET since\/\d+$/.test(line) || /\/since\/\d+$/.test(line));
    arrivedRe = read(hre.mirror, relRe) === bodyRe;
  } finally {
    await hre.runner.stop(); await deskRe.ch.stop();
  }
  const reopened = !!upRe && upRe.ok === true && upRe.offline === false && arrivedRe
    && helloAt >= 0 && sessionAt > helloAt && sinceAt > sessionAt;
  check(twoBusy && reopened,
    "rs911 two of a desk's files listed, the second blob answered 503, is not a catch-up " + twoBusy
    + " (fetches " + getsTwo + ", " + JSON.stringify(upTwo && { ok: upTwo.ok, offline: upTwo.offline }) + ")"
    + "; a session reopened before the since page still returns " + reopened
    + " (hello " + helloAt + ", session " + sessionAt + ", since " + sinceAt
    + ", ok " + !!(upRe && upRe.ok === true) + ", arrived " + arrivedRe + ")");
  /* THE NEW CLIENT'S ORDER (engine 7f52282d, channel.cjs catchUp, holdListed, landLater, relistHeld): a desk's file a since page
     names is held unfetched, the list is read until a page names nothing more, and only then is each held file fetched; a held
     file leaves the held list only where it landed, was refused, or the relay said it is gone. Each scene is one catch-up before a
     move, read beside that client's own calls (the lab transport's log): what Studio cannot show was taken is not a catch-up, in
     any order of calls (the test architect, 2026-11-17). */
  const busy = () => ({ status: 503, header: () => null, bytes: Buffer.from("{\"error\":\"busy\"}") });
  const blobOf = (u) => { const m = /\/b\/([0-9a-f]{32})$/.exec(String(u)); return m ? m[1] : ""; };
  const sinceOf = (u) => { const m = /\/since\/(\d+)$/.exec(String(u)); return m ? Number(m[1]) : -1; };
  const sinceLines = (log) => log.map((l, i) => (/^GET since\/\d+$/.test(l) ? i : -1)).filter((i) => i >= 0);
  const firstBlob = (log, id) => log.findIndex((l) => (id ? l === "GET b/" + id : /^GET b\/[0-9a-f]{32}$/.test(l)));
  /* The relay's own answer to a since call cut to its first row, so a list of two files is read as two pages and an empty one. */
  const pageOfOne = async (method, url, headers) => {
    const res = await world.relayFetch(url, { method, headers });
    const bytes = Buffer.from(await res.arrayBuffer());
    let list = null;
    try { list = JSON.parse(bytes.toString("utf8")); } catch { list = null; }
    if (res.status !== 200 || !Array.isArray(list)) return { status: res.status, header: (n) => res.headers.get(n), bytes };
    return { status: 200, header: (n) => res.headers.get(n), bytes: Buffer.from(JSON.stringify(list.slice(0, 1)), "utf8"), first: list[0] };
  };
  const scene = async (label, files, o) => {
    const x = o || {};
    const W = deskKeys(), labW = labDir("relay-rs911-" + label);
    const w = await studioLead(world, labW, { roster: [W], wraps: true });
    await twice(w);
    const deskW = deskOf(world, labW, w, label, W, new Map([[1, w.teamKey]]));
    const rels = files.map((f) => "desks/" + W.keyId + "/" + f);
    try {
      deskW.ch.start(); await settle(deskW.ch);
      rels.forEach((rel, i) => put(deskW.mirror, rel, "{\"note\":\"" + label + " " + (i + 1) + "\"}\n"));
      await settle(deskW.ch);
      if (x.before) await x.before(w, W);
      const absent = rels.every((rel) => read(w.mirror, rel) === null);
      const mark = w.t.log.length;
      w.t.answer = x.answer ? x.answer(w, W) : null;
      const up = await Relay.catchUpBeforeMove(w.runner, w.teamId);
      const ch = w.chan(), held = ch && ch.program ? ch.program.later().length : -1;
      /* Stopped while the answer is still given, so no later cycle fetches what this catch-up did not. */
      await w.runner.stop(); await deskW.ch.stop();
      return { absent, held, log: w.t.log.slice(mark), arrived: rels.map((rel) => read(w.mirror, rel) !== null),
        ok: !!up && up.ok === true && up.offline === false && !up.said && !up.saidPl,
        told: !!up && up.ok === false && up.offline === true && up.said === CATCH_UP_EN && up.saidPl === CATCH_UP_PL };
    } finally {
      w.t.answer = null;
      await w.runner.stop(); await deskW.ch.stop();
    }
  };
  /* A held file fetched once the list is read whole, answered 503. */
  const afterLast = await scene("late", ["in-use.ec"], { answer: () => (method, url) => (method === "GET" && blobOf(url) ? busy() : null) });
  const lateAt = firstBlob(afterLast.log), lateSince = sinceLines(afterLast.log);
  const lateOrder = lateSince.length >= 2 && lateAt > lateSince[lateSince.length - 1];
  check(afterLast.told && afterLast.absent && !afterLast.arrived[0] && lateOrder,
    "rs911 a desk's file held by the catch-up and fetched after its last page, answered 503, is not a catch-up " + afterLast.told
    + " (fetched after the last page " + lateOrder + ", absent before " + afterLast.absent + ", still absent " + !afterLast.arrived[0] + ")");
  /* Two files of a desk on two pages of the list, the second page's file answered 503. */
  const pageIds = [];
  const paged = await scene("pages", ["in-use.ec", "catalog-answer.ec"], { answer: () => async (method, url, headers) => {
    if (method === "GET" && sinceOf(url) >= 0) {
      const r = await pageOfOne(method, url, headers);
      pageIds.push(r.first && r.first.meta ? String(r.first.meta.id) : "");
      return r;
    }
    return method === "GET" && blobOf(url) && blobOf(url) === pageIds[1] ? busy() : null;
  } });
  const twoPages = pageIds.length >= 3 && !!pageIds[0] && !!pageIds[1] && pageIds[0] !== pageIds[1];
  const secondAsked = firstBlob(paged.log, pageIds[1]) > sinceLines(paged.log).pop();
  check(paged.told && paged.absent && twoPages && secondAsked && paged.arrived.filter(Boolean).length <= 1,
    "rs911 a list of more than one page, the second page's file answered 503, is not a catch-up " + paged.told
    + " (pages " + pageIds.length + ", two files on two pages " + twoPages + ", the second fetched after the last page " + secondAsked
    + ", arrived " + paged.arrived.filter(Boolean).length + " of 2)");
  /* The list's first page served, every since page after it answered 503: no good page follows. */
  let sinceCalls = 0;
  const cut = await scene("since-late", ["in-use.ec"], { answer: () => (method, url) => {
    if (!(method === "GET" && sinceOf(url) >= 0)) return null;
    sinceCalls += 1;
    return sinceCalls >= 2 ? busy() : null;
  } });
  check(cut.told && cut.absent && !cut.arrived[0] && sinceCalls >= 2,
    "rs911 CONTROL: a since page answered 503 with no good page after it is not a catch-up " + cut.told
    + " (since pages " + sinceCalls + ", absent before " + cut.absent + ", still absent " + !cut.arrived[0] + ")");
  /* A file the channel still holds at idle, every call of the catch-up answered 200: held by an earlier catch-up whose fetch was
     answered 503, then served without its description while the relay's list read again no longer names it at its place, so the
     channel keeps it held (channel.cjs landLater, its stay) and the wire shows nothing missed. */
  let heldRow = null, heldServed = 0;
  const idle = await scene("held-idle", ["in-use.ec"], {
    before: async (w, W) => {
      w.t.answer = (method, url) => (method === "GET" && blobOf(url) ? busy() : null);
      await Relay.catchUpBeforeMove(w.runner, w.teamId);
      w.t.answer = null;
      heldRow = world.blobsBy(w.rt, W.keyId)[0] || null;
    },
    answer: () => async (method, url, headers) => {
      if (!heldRow || method !== "GET") return null;
      if (blobOf(url) === heldRow.id) {
        heldServed += 1;
        const res = await world.relayFetch(url, { method, headers });
        return { status: res.status, header: () => null, bytes: Buffer.from(await res.arrayBuffer()) };
      }
      return sinceOf(url) === heldRow.seq - 1 ? { status: 200, header: () => null, bytes: Buffer.from("[]", "utf8") } : null;
    } });
  check(idle.told && idle.absent && !idle.arrived[0] && heldServed >= 1 && idle.held >= 1,
    "rs911 a file the channel still holds at idle, with no call of the catch-up answered anything but 200, is not a catch-up " + idle.told
    + " (served without its description " + heldServed + ", held at idle " + idle.held + ", absent before " + idle.absent
    + ", still absent " + !idle.arrived[0] + ")");
  /* CONTROL: a file the relay lists from a writer the team does not name is fetched on its own page, not held; answered 503. */
  let strayId = "";
  const stray = await scene("stranger", [], {
    before: async (w) => {
      strayId = hex(16);
      world.inject(w.rt, { id: strayId, supersedes: null, epoch: 1, writer: "k-" + hex(8), counter: 1, del: false, sig: hex(64),
        nonce: hex(12) }, crypto.randomBytes(64));
    },
    answer: () => (method, url) => (method === "GET" && blobOf(url) === strayId ? busy() : null) });
  const strayAt = firstBlob(stray.log, strayId);
  const onItsPage = strayAt > 0 && /^GET since\/\d+$/.test(stray.log[strayAt - 1]);
  check(stray.told && onItsPage && stray.held === 0,
    "rs911 CONTROL: a listed file fetched on its own page, not held, answered 503, is not a catch-up " + stray.told
    + " (fetched right after its page " + onItsPage + ", held at idle " + stray.held + ")");
  /* CONTROL: an ordinary whole catch-up through the new client. */
  const whole = await scene("whole", ["in-use.ec", "catalog-answer.ec"]);
  const wholeSince = sinceLines(whole.log), wholeAt = firstBlob(whole.log);
  const wholeOrder = wholeSince.length >= 2 && wholeAt > wholeSince[wholeSince.length - 1];
  check(whole.ok && whole.absent && whole.arrived.every(Boolean) && whole.held === 0 && wholeOrder,
    "rs911 CONTROL: an ordinary whole catch-up through the new client is a catch-up " + whole.ok
    + " (both files held and fetched after the last page " + wholeOrder + ", absent before " + whole.absent
    + ", both arrived " + whole.arrived.every(Boolean) + ", held at idle " + whole.held + ")");
  await s.runner.stop(); await desk.ch.stop(); await b.runner.stop(); await deskB.ch.stop();
};

/* The shell, loaded once per leg against a stub of Electron, so landDue and the member-remove reply run as the window
   runs them. No window is opened and nothing is asked of the network: net.fetch rejects, unless a leg hands `relay`, a
   lab transport, which then answers the shell's own calls (src/wire.cjs) and its socket. */
const SHELL_VAULT = {
  isEncryptionAvailable: () => true,
  encryptString: (s) => Buffer.from("sealed:" + Buffer.from(String(s), "utf8").reverse().toString("hex"), "utf8"),
  decryptString: (b) => {
    const t = Buffer.from(b).toString("utf8");
    if (!t.startsWith("sealed:")) throw new Error("not sealed here");
    return Buffer.from(t.slice(7), "hex").reverse().toString("utf8");
  },
};
const shellVault = () => ({ available: () => true, seal: (t) => SHELL_VAULT.encryptString(t), open: (b) => SHELL_VAULT.decryptString(b) });
/* A lab lead key, kept as an installed Studio keeps one: osFile of a fresh pair, the private half sealed by the
   shell's vault stand-in. labSecret is what that stand-in opens it to, and PASS where the file is a passphrase
   file. A part about a passphrase file names the file with namePassphraseFile. */
const passphraseOnPurpose = new Set();
function namePassphraseFile(at) { passphraseOnPurpose.add(path.resolve(String(at))); }
async function labLeadKey() {
  const pair = await makePair();
  return osFile(pair, SHELL_VAULT.encryptString(pair.der));
}
function labSecret(keyFile) {
  let read = null;
  try { read = readKeyFile(keyFile); } catch { return PASS; }
  if (!read || read.kept !== OS_WRAP) return PASS;
  try { return String(SHELL_VAULT.decryptString(Buffer.from(String(read.doc.private), "base64"))); }
  catch { return ""; }
}
async function loadStudioShell(ud, o) {
  /* A shell's done() puts the environment back only once its quit handlers have run, so a leg that opens a second shell
     without awaiting the first one's done() would have its new environment put back under it. Each shell therefore starts
     after every earlier shell has stopped. */
  await Promise.allSettled(shellStops.slice()); /* plant:shell-after-stop */
  const opts = o || {}, Module = nodeRequire("node:module"), main = path.join(ROOT, "shell", "main.js");
  const ui = path.join(ROOT, "ui", "index.html");
  const got = { handlers: {}, windows: [], said: [], appOn: {}, clipboard: [] };
  const bag = (into) => (t, fn) => { (into[t] = into[t] || []).push(fn); };
  class Win {
    constructor() {
      this.wcOn = {}; this.winOn = {};
      this.webContents = { id: 1, on: bag(this.wcOn), once: bag(this.wcOn), send() {}, setWindowOpenHandler() {},
        getURL: () => pathToFileURL(ui).href, reload() {}, forcefullyCrashRenderer() {} };
      got.windows.push(this);
    }
    on(t, fn) { bag(this.winOn)(t, fn); }
    once(t, fn) { bag(this.winOn)(t, fn); }
    isDestroyed() { return false; }
    isMaximized() { return false; }
    isMinimized() { return false; }
    close() {} focus() {} restore() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
  }
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
  const electron = {
    app: { commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: () => ud, getVersion: () => "0.0.0", getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true, whenReady: () => Promise.resolve(),
      on: (t, fn) => { (got.appOn[t] = got.appOn[t] || []).push(fn); }, quit() {}, exit() {} },
    BrowserWindow: Object.assign(Win, { fromWebContents: () => got.windows[0] || null, getAllWindows: () => got.windows }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }),
      showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
      showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }) },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText: (t) => { got.clipboard.push(String(t)); } }, safeStorage: SHELL_VAULT,
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {},
      setDevicePermissionHandler() {}, setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {},
      setSpellCheckerEnabled() {} } },
    shell: { openPath: () => Promise.resolve(""), trashItem: () => Promise.resolve() },
    ipcMain: { handle: (ch, fn) => { got.handlers[ch] = fn; }, on() {} },
    /* `opts.relay`, a lab transport, answers the shell's own calls to the relay; with none, net.fetch rejects. */
    net: { fetch: opts.relay ? async (url, init) => {
      const r = await opts.relay.request(String(init && init.method), String(url), init && init.headers, init && init.body);
      const bytes = Buffer.from(r.bytes);
      return { status: r.status, headers: { get: (n) => r.header(n) },
        body: new ReadableStream({ start(c) { if (bytes.length) c.enqueue(new Uint8Array(bytes)); c.close(); } }) };
    } : () => Promise.reject(new Error("the lab does not reach the relay")) },
  };
  const thread = { call: (verb, ...a) => (opts.thread ? opts.thread(verb, ...a) : Promise.resolve({})) };
  const quiet = { on() {}, unref() {}, kill() {}, pid: 0, stdout: { on() {} }, stderr: { on() {} }, stdin: { end() {}, write() {} } };
  const cp = { execFileSync: () => "", execSync: () => "", spawnSync: () => ({ status: 0, stdout: "", stderr: "" }),
    execFile: () => quiet, spawn: () => quiet, exec: () => quiet, fork: () => quiet };
  const env = Object.assign({ STUDIO_NO_PROXY_SERVER: "off", STUDIO_TEST_OFFSCREEN: "1",
    XDG_CURRENT_DESKTOP: "GNOME" }, opts.env || {});
  const was = {};
  /* A Studio that works, as a lead's does (the gate refuses a closed channel of one that does not). */
  /* A leg that has the lab's root trusted (STUDIO_VENDOR_KEY, set for its length) has its licence signed by that root. */
  const trusted = Object.assign({}, process.env.STUDIO_VENDOR_KEY ? { STUDIO_VENDOR_KEY: process.env.STUDIO_VENDOR_KEY } : {}, opts.env || {});
  Object.assign(env, await seatEnv(ud, true, trusted, trusted.STUDIO_VENDOR_KEY === GRANT_ROOT_PUB ? grantKit.ROOT.privateKey : undefined), opts.env || {});
  for (const k of Object.keys(env)) { was[k] = process.env[k]; process.env[k] = env[k]; }
  armTimerTrack();
  /* A copy of src/wire.cjs that an earlier leg required under node alone has no net (rs10), and is not the one the shell loads. */
  if (opts.relay) delete nodeRequire.cache[nodeRequire.resolve(path.join(ROOT, "src", "wire.cjs"))];
  const load = Module._load, write = process.stderr.write, before = new Set(Object.keys(nodeRequire.cache));
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (/studio-thread\.cjs$/.test(req)) return thread;
    return load.apply(this, arguments);
  };
  process.stderr.write = (s) => {
    const line = String(s);
    if (/^studio {2}/.test(line)) { got.said.push(line.trim()); return true; }
    return write.call(process.stderr, s);
  };
  const dropCache = () => {
    delete nodeRequire.cache[main];
    for (const k of Object.keys(nodeRequire.cache)) if (!before.has(k)) delete nodeRequire.cache[k];
  };
  const restore = () => {
    if (restore.did) return;
    restore.did = true;
    disarmTimerTrack();
    Module._load = load; process.stderr.write = write; dropCache();
    for (const k of Object.keys(was)) { if (was[k] === undefined) delete process.env[k]; else process.env[k] = was[k]; }
    const at = shellRestores.indexOf(restore);
    if (at >= 0) shellRestores.splice(at, 1);
  };
  shellRestores.push(restore);
  let opened = false, shellMain = null;
  try {
    dropCache();
    shellMain = nodeRequire(main);
    /* The shell holds src/wire.cjs's exports and reads relayConnect from them at each sync: the lab's socket in its place. */
    if (opts.relay) nodeRequire(path.join(ROOT, "src", "wire.cjs")).relayConnect = opts.relay.connect;
    for (let i = 0; i < 1250 && !got.windows.length; i++) await wait(20);
    opened = got.windows.length > 0;
  } finally {
    if (!opened) restore();
  }
  got.win = got.windows[0] || null;
  got.fire = async (t, ...a) => { for (const fn of ((got.win && got.win.winOn[t]) || [])) await fn(...a); };
  got.event = { senderFrame: { parent: null, url: pathToFileURL(ui).href }, sender: got.win && got.win.webContents };
  got.ask = (ch, ...a) => got.handlers[ch](got.event, ...a);
  got.relaySync = () => (shellMain && typeof shellMain.relaySync === "function" ? shellMain.relaySync() : Promise.resolve());
  /* will-quit returns endRelay(), which waits out the sync and then stops the runner and the shell's timers. The promise is
     kept for the harness, so a leg that calls done() and does not await it still finishes the stop before the next leg. */
  got.done = () => {
    const job = (async () => {
      try {
        for (const fn of got.appOn["will-quit"] || []) { try { await fn(); } catch { /* the watch is already gone */ } }
      } finally { restore(); }
    })();
    shellStops.push(job);
    return job;
  };
  return got;
}

/* Board 911 gap: the shell's landDue passes the removal record, so an answer stored while trusted still lands after
   the desk has left the roster. The window's focus is what runs that call. */
LEGS.rs2l = async () => {
  const lab = labDir("relay-rs2l"), ud = path.join(lab, "ud"), share = path.join(lab, "share");
  fs.mkdirSync(ud, { recursive: true }); fs.mkdirSync(share, { recursive: true });
  const keyAt = path.join(ud, "signing-key.json");
  const made = await labLeadKey();
  fs.writeFileSync(keyAt, JSON.stringify(made, null, 1) + "\n");
  const teamsFile = K.teamsFile(ud), vault = shellVault(), teamId = "t-" + hex(8), teamKey = crypto.randomBytes(32);
  K.keepTeamKey(teamsFile, vault, teamId, 1, teamKey);
  K.chooseSealed(teamsFile, teamId, true, share);
  /* On the relay, the folder standing for the mirror the watch reads (was: kept for a shared folder, which the watch passes by; the folder team's removal). */
  { const doc = JSON.parse(fs.readFileSync(teamsFile, "utf8")); doc.teams[teamId].relay = { rt: "5c".repeat(16), url: "https://etiuda.dev" }; fs.writeFileSync(teamsFile, JSON.stringify(doc, null, 1) + "\n"); }
  /* Since stage 0b a team-key answer lands only about a catalog the team lists, so the team lists the edition's own id. */
  const quay = await quayEdition(lab, path.join(lab, "edition"));
  const listed = [String(quay.from.id)];
  const team = newTeam({ id: teamId, catalogs: listed, lead: { keyId: made.keyId, public: made.public }, sealed: true });
  await writeTeam(share, team, { key: keyAt, passphrase: labSecret(keyAt) });
  const D = deskKeys();
  const pin = Engine.deskRules().signedSha(quay.from);
  const open = unlockKey(readKeyFile(keyAt), labSecret(keyAt));
  const Use = await import("../src/catalog-use.mjs");
  const rel = "desks/" + D.keyId + "/catalog-answer.ec";
  const ask2l = Use.buildAsk({ desk: D.keyId, sha256: pin, lead: { keyId: open.keyId, public: open.public, privateKey: open.privateKey } });
  put(share, rel, sealFor(teamKey, teamId, 1, signedAnswer(D, ask2l.id, teamId, pin, quay.from)));
  K.markRemoved(teamsFile, teamId, { id: D.keyId, key: D.pub }, Date.now(), 2, deskSnapshot(share, D.keyId));
  Use.writeAsk(share, D.keyId, ask2l);
  const owed = Use.answersDue(share, { [teamId]: { 1: teamKey } }, {}, {
    lead: { keyId: made.keyId, public: made.public }, roster: [], removed: K.removedOf(teamsFile, teamId),
    team: teamId, epoch: 1, catalogs: listed, content: null, deskKeys: {},
  }).length;
  /* The shape this fixture had before stage 0b stays refused: the same stored answer, with the team listing another catalog. */
  const refused2l = [];
  const unlistedOwed = Use.answersDue(share, { [teamId]: { 1: teamKey } }, {}, {
    lead: { keyId: made.keyId, public: made.public }, roster: [], removed: K.removedOf(teamsFile, teamId), refused: refused2l,
    team: teamId, epoch: 1, catalogs: ["quay-lamps"], content: null, deskKeys: {},
  }).length;
  const unlistedRefused = unlistedOwed === 0
    && refused2l.some((r) => r.why === "a team-key answer about a catalog the team does not list");
  const shell = await loadStudioShell(ud, { env: { STUDIO_PROJECTS: path.join(lab, "brought"), STUDIO_SIGNING_KEY: keyAt } });
  let landed = false, askLeft = true;
  try {
    if (shell.win) await shell.fire("focus");
    const askAt = path.join(share, "catalog-asks", D.keyId + ".json");
    landed = await until(() => {
      let book = null;
      try { book = JSON.parse(fs.readFileSync(path.join(ud, "catalog-landed.json"), "utf8")); } catch { book = null; }
      const row = book && book.folders && book.folders[path.resolve(share)];
      return !!(row && row.done && Object.keys(row.done).some((id) => row.done[id] === true));
    }, 20000);
    /* A folder team's writes go to its mirror and reach the share through the syncer, a deletion last (the mirror slice, fms2),
       so the ask's withdrawal is read on the share once it has had time to land. */
    askLeft = !(await until(() => !fs.existsSync(askAt), 15000));
  } finally { shell.done(); }
  check(shell.win && owed === 1 && unlistedRefused && landed && !askLeft,
    "rs2l the shell's landDue, on focus, lands the answer a removed desk stored while trusted: window " + !!shell.win
    + ", owed " + owed + ", refused about an unlisted catalog " + unlistedRefused + ", landed " + landed + ", ask withdrawn " + !askLeft
    + (shell.said.length ? " (" + shell.said.slice(0, 4).join(" | ") + ")" : ""));
};

/* Board 911: with no signing key the relay channel is never opened, the catch-up is the offline sentence, and the
   member-remove reply is where the lead reads it. Nothing is asked of the network. */
LEGS.rs911h = async () => {
  const lab = labDir("relay-rs911h"), ud = path.join(lab, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const teamsFile = K.teamsFile(ud), vault = shellVault(), teamId = "t-" + hex(8), D = deskKeys();
  K.keepTeamKey(teamsFile, vault, teamId, 1, crypto.randomBytes(32));
  fs.mkdirSync(K.keepRelay(teamsFile, teamId, Relay.relayId(), Relay.RELAY_URL), { recursive: true });
  /* The shell keeps the next epoch's key itself and hands it to the thread. Returning another would be refused,
     and the refusal lands before the sentence is copied onto the reply. */
  const shell = await loadStudioShell(ud, { thread: (verb) => {
    if (verb === "teamFacts") return { team: { id: teamId, epoch: 1, roster: [{ id: D.keyId }] }, file: "share" };
    if (verb === "removeMember") return { removed: D.keyId, team: { id: teamId, epoch: 2, roster: [] } };
    return {};
  } });
  let reply = null;
  /* The project stands where this shell lists catalogs (a direct child of <userData>/Etiuda Studio). */
  try { reply = await shell.ask("studio:member-remove", path.join(ud, "Etiuda Studio", "project"), teamId, D.keyId, true); }
  finally { shell.done(); }
  check(!!shell.win && !!reply && reply.error === null && reply.removed === D.keyId && reply.catchUpSaid === CATCH_UP_EN,
    "rs911h the member-remove reply carries the catch-up sentence: window " + !!shell.win
    + ", error " + (reply && JSON.stringify(reply.error)) + ", removed " + (reply && reply.removed === D.keyId)
    + ", said " + (reply && reply.catchUpSaid === CATCH_UP_EN)
    + (shell.said.length ? " (" + shell.said.slice(0, 3).join(" | ") + ")" : ""));
};

/* Board 914. A seal the lead still holds for a spent invitation, or for one withdrawn or past its end, is not a key an
   unrostered join is opened under. A live invitation's own request still is. */
LEGS.rs914a = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs914a"), lines = [];
  const s = await studioLead(world, lab, { say: (l) => lines.push(l) });
  const S = await import("../src/studio.mjs");
  const target = { team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } };
  const kept = (name) => {
    const secret = newSecret(), ri = Relay.relayInvite(secret);
    const made = makeInvite(target, name, secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
    K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
    return { secret, ri, made };
  };
  const live = kept("Nera Quay"), withdrawn = kept("Bram Quay"), expired = kept("Lina Quay");
  await s.runner.sync(); await s.runner.idle();
  const N = deskKeys(), held = new Map();
  const joiner = deskOf(world, lab, s, "joiner", N, held, { invite: () => ({ inv: live.ri.inv, token: live.ri.token, seal: live.ri.seal }) });
  put(joiner.mirror, "desks/" + N.keyId + "/join.json", JSON.stringify(joinRequest(s.teamId, N, { id: live.made.id, secret: live.secret }), null, 1) + "\n");
  joiner.ch.start(); await settle(joiner.ch);
  await s.runner.sync(); await s.runner.idle();
  const honest = read(s.mirror, "desks/" + N.keyId + "/join.json");
  joiner.t.down = true; await joiner.ch.stop();
  const admitted = await S.watchAdmit(s.mirror, s.keyAt, labSecret(s.keyAt), { auto: false, teamKeys: K.teamKeysOf(s.teamsFile, s.vault),
    invites: K.inviteBookOf(s.teamsFile, s.vault), teamsFile: s.teamsFile });
  for (const x of admitted.spent || []) K.endInvite(s.teamsFile, s.teamId, x.invite, "spent", x.desk);
  K.endInvite(s.teamsFile, s.teamId, withdrawn.made.id, "withdrawn");
  const book = JSON.parse(fs.readFileSync(s.teamsFile, "utf8"));
  book.teams[s.teamId].invites[expired.made.id].expires = "2020-01-01T00:00:00.000Z";
  fs.writeFileSync(s.teamsFile, JSON.stringify(book, null, 1) + "\n");
  const forge = (seal, note) => {
    const who = deskKeys();
    const body = "{\"note\":\"" + note + "\"}\n";
    const b = world.B.seal({ relayTeamId: s.rt, epoch: 1, teamKey: seal, writer: { keyId: who.keyId, privateKey: who.privateKey },
      path: "desks/" + who.keyId + "/join.json", body, counter: Date.now(), place: "desk:" + who.keyId, kind: "file" });
    world.inject(s.rt, { v: 1, id: b.id, supersedes: null, epoch: b.epoch, writer: b.writerKeyId, counter: b.counter, del: false,
      sig: b.signature, nonce: b.nonce, place: b.place, pub: who.pub }, b.ciphertext);
    return who.keyId;
  };
  const rogueSpent = forge(live.ri.seal, "north-lamp-spent");
  const rogueWithdrawn = forge(withdrawn.ri.seal, "west-lamp-withdrawn");
  const rogueExpired = forge(expired.ri.seal, "south-lamp-expired");
  s.chan().kick(); await s.chan().idle();
  const spentLanded = read(s.mirror, "desks/" + rogueSpent + "/join.json");
  const withdrawnLanded = read(s.mirror, "desks/" + rogueWithdrawn + "/join.json");
  const expiredLanded = read(s.mirror, "desks/" + rogueExpired + "/join.json");
  const still = K.relayInvitesOf(s.teamsFile, s.vault, s.teamId).find((i) => i.id === live.made.id);
  check(!!honest && (admitted.admitted || []).indexOf(N.keyId) >= 0 && !!still && still.state === "spent" && !still.gone
    && !spentLanded && !withdrawnLanded && !expiredLanded,
    "rs914a a join sealed under a spent, withdrawn or expired invitation is not opened, and one under a live invitation is: live "
    + !!honest + ", admitted " + (admitted.admitted || []).length + ", spent landed " + !!spentLanded + ", withdrawn landed "
    + !!withdrawnLanded + ", expired landed " + !!expiredLanded
    + (lines.length ? " (" + lines.slice(-3).join(" | ") + ")" : ""));
  await s.runner.stop();
};

/* Board 914. Both relay and folder teams admit only a request that names a live invitation (or a known person). A bare
   request without an invitation is never let in. */
LEGS.rs914b = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs914b");
  const s = await studioLead(world, lab);
  const S = await import("../src/studio.mjs");
  const target = { team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } };
  const invite = (name) => {
    const secret = newSecret(), ri = Relay.relayInvite(secret);
    const made = makeInvite(target, name, secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
    K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
    return { id: made.id, secret };
  };
  const live = invite("Nera Quay"), again = invite("Bram Quay"), withdrawn = invite("Lina Quay");
  K.endInvite(s.teamsFile, s.teamId, withdrawn.id, "withdrawn");
  const bare = deskKeys(), byLive = deskKeys(), byAgain = deskKeys(), byOld = deskKeys();
  const writeJoin = (who, inv) => put(s.mirror, "desks/" + who.keyId + "/join.json", JSON.stringify(joinRequest(s.teamId, who, inv), null, 1) + "\n");
  writeJoin(bare, null);
  writeJoin(byLive, live);
  writeJoin(byOld, withdrawn);
  const opts = () => ({ teamKeys: K.teamKeysOf(s.teamsFile, s.vault), invites: K.inviteBookOf(s.teamsFile, s.vault), teamsFile: s.teamsFile });
  const on = await S.watchAdmit(s.mirror, s.keyAt, labSecret(s.keyAt), opts());
  const onIds = on.admitted || [];
  writeJoin(byAgain, again);
  const off = await S.watchAdmit(s.mirror, s.keyAt, labSecret(s.keyAt), opts());
  const offIds = off.admitted || [];
  const skippedOld = (on.skipped || []).some((x) => x.id === byOld.keyId && x.why === "withdrawn");
  const share = path.join(lab, "share");
  fs.mkdirSync(share, { recursive: true });
  const fid = "t-" + hex(8), folderKey = crypto.randomBytes(32), folderDesk = deskKeys();
  K.keepTeamKey(s.teamsFile, s.vault, fid, 1, folderKey);
  const plain = newTeam({ id: fid, catalogs: ["harbour-lamps"], lead: { keyId: s.lead.keyId, public: s.lead.public }, sealed: true, exportsSealed: true });
  await writeTeam(share, plain, { key: s.keyAt, passphrase: labSecret(s.keyAt) });
  put(share, "desks/" + folderDesk.keyId + "/join.json", JSON.stringify(joinRequest(fid, folderDesk, null), null, 1) + "\n");
  const folder = await S.watchAdmit(share, s.keyAt, labSecret(s.keyAt), { teamKeys: K.teamKeysOf(s.teamsFile, s.vault), invites: {}, teamsFile: s.teamsFile });
  const folderIds = folder.admitted || [];
  check(onIds.indexOf(bare.keyId) < 0 && onIds.indexOf(byOld.keyId) < 0 && onIds.indexOf(byLive.keyId) >= 0 && skippedOld
    && offIds.indexOf(bare.keyId) < 0 && offIds.indexOf(byAgain.keyId) >= 0 && folderIds.indexOf(folderDesk.keyId) < 0,
    "rs914b both relay and folder teams refuse or hold back a bare request without an invitation, while a live invitation is admitted: "
    + "on " + JSON.stringify(onIds) + ", skipped withdrawn " + skippedOld + ", off " + JSON.stringify(offIds)
    + ", folder " + JSON.stringify(folderIds));
  await s.runner.stop();
};

/* Board 914, condition (2) of the slice 1 verdict: the relay refuses the first invitations call after the lead withdraws
   a registered invitation, and the next sync leaves no live token. */
LEGS.rs914c = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs914c");
  const s = await studioLead(world, lab);
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const target = { team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } };
  const made = makeInvite(target, "Nera Quay", secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  await s.runner.sync(); await s.runner.idle();
  const registered = !!world.store(s.rt).get("inv:" + ri.inv);
  K.endInvite(s.teamsFile, s.teamId, made.id, "withdrawn");
  let refused = 0;
  s.t.answer = (method, url) => {
    if (method !== "POST" || !/\/invites$/.test(String(url)) || refused) return null;
    refused++;
    return { status: 503, header: () => null, bytes: Buffer.from(JSON.stringify({ error: "busy" })) };
  };
  const first = await s.runner.sync(); await s.runner.idle();
  const heldWhileRefused = !!world.store(s.rt).get("inv:" + ri.inv);
  s.t.answer = null;
  await s.runner.sync(); await s.runner.idle();
  const keptRec = world.store(s.rt).get("inv:" + ri.inv);
  const dropped = !keptRec || (keptRec.spent === true && Object.keys(keptRec).length === 1);
  const refusedOnce = !!first[0] && first[0].ok === false;
  check(registered && refused === 1 && heldWhileRefused && dropped && refusedOnce,
    "rs914c a withdrawn invitation whose drop the relay refuses once is dropped at the next sync: registered " + registered
    + ", refused " + refused + " (" + JSON.stringify((first || []).map((r) => r.reason || "ok")) + "), held while refused "
    + heldWhileRefused + ", dropped after " + dropped + " " + JSON.stringify(keptRec || null).slice(0, 80));
  await s.runner.stop();
};

/* A withdrawal the relay refuses once is sent again at the next sync, so a desk an epoch move drops loses its reads,
   and its hello is then refused removed. */
LEGS.rs4w = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs4w");
  const D = deskKeys(), G = deskKeys();
  const s = await studioLead(world, lab, { roster: [D, G], wraps: true });
  await s.runner.sync(); await s.runner.idle();
  const both = !!world.store(s.rt).get("dev:" + D.keyId) && !!world.store(s.rt).get("dev:" + G.keyId);
  const h = await heldTeam(s.mirror, { key: s.keyAt });
  const next = await newEpoch(h.team, { key: s.keyAt, remove: G.keyId, secret: labSecret(s.keyAt) });
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, 2, next.teamKey);
  await writeTeam(s.mirror, next.team, { key: s.keyAt, passphrase: labSecret(s.keyAt) });
  let refused = 0;
  s.t.answer = (method, url) => {
    if (method !== "POST" || !/\/devices$/.test(String(url)) || refused) return null;
    refused += 1;
    return { status: 503, header: () => null, bytes: Buffer.from(JSON.stringify({ error: "busy" })) };
  };
  const first = await s.runner.sync(); await s.runner.idle();
  const stillThere = !!world.store(s.rt).get("dev:" + G.keyId);
  s.t.answer = null;
  await s.runner.sync(); await s.runner.idle();
  const withdrawn = !!world.store(s.rt).get("gone:" + G.keyId) && !world.store(s.rt).get("dev:" + G.keyId) && !!world.store(s.rt).get("dev:" + D.keyId);
  const t = world.transport("rs4w-hello");
  const challenge = JSON.parse((await t.request("POST", Relay.RELAY_URL + "/t/" + s.rt + "/hello", {}, Buffer.from("{}"))).bytes.toString()).challenge;
  const ses = await t.request("POST", Relay.RELAY_URL + "/t/" + s.rt + "/session", { "content-type": "application/json" },
    Buffer.from(JSON.stringify({ challenge: challenge, key: G.keyId, pub: G.pub, sig: crypto.sign(null, world.C.helloBytes(s.rt, challenge, G.keyId), G.privateKey).toString("hex") })));
  const refusedNow = JSON.parse(ses.bytes.toString()).error;
  check(both && refused === 1 && stillThere && withdrawn && refusedNow === "removed",
    "rs4w a withdrawal the relay refuses once is sent again at the next sync, and the desk's hello is then refused removed: enrolled " + both
    + ", refused " + refused + " (" + JSON.stringify(first.map((r) => r.reason || "ok")) + "), still enrolled while refused " + stillThere
    + ", withdrawn after " + withdrawn + ", its hello now " + refusedNow);
  await s.runner.stop();
};

/* A space the relay refuses once is asked for again at the next sync, and that sync makes it. */
LEGS.rs2b = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs2b");
  const s = await studioLead(world, lab);
  let refused = 0;
  s.t.answer = (method, url) => {
    if (method !== "POST" || !/\/teams$/.test(String(url)) || refused) return null;
    refused += 1;
    return { status: 503, header: () => null, bytes: Buffer.from(JSON.stringify({ error: "busy" })) };
  };
  const first = await s.runner.sync(); await s.runner.idle();
  s.t.answer = null;
  const second = await s.runner.sync(); await s.runner.idle();
  const made = !!(world.store(s.rt) && world.store(s.rt).get("team"));
  check(refused === 1 && made && !!(second[0] && second[0].ok === true),
    "rs2b a space the relay refuses once is made at the next sync: refused " + refused
    + " (" + JSON.stringify(first.map((r) => r.reason || "ok")) + "), made after " + made
    + " (" + JSON.stringify(second.map((r) => r.reason || "ok")) + ")");
  await s.runner.stop();
};

/* E4, Studio's half. A ring with a key at the mirror's root is folded into the next signed team file and reaches a desk
   inside it. A key then taken out of that ring is out of the next signed file, and the desk's copy no longer names it. */
LEGS.rsring = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsring");
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true });
  await s.runner.sync(); await s.runner.idle();
  const C = world.C, at = path.join(s.mirror, Relay.RING_FILE);
  const before = await heldTeam(s.mirror, { key: s.keyAt });
  const withKey = { format: RING.format, kind: RING.kind, keys: [{ keyId: s.lead.keyId, public: s.lead.public, catalogs: ["harbour-lamps"] }] };
  fs.writeFileSync(at, JSON.stringify(withKey, null, 1) + "\n");
  await s.runner.sync(); await s.runner.idle();
  const one = await heldTeam(s.mirror, { key: s.keyAt });
  const folded = !!one.team && C.canon(one.team.ring || null) === C.canon(withKey) && one.team.rev > before.team.rev;
  const desk = deskOf(world, lab, s, "desk", D, new Map([[1, s.teamKey]]));
  desk.ch.start(); await settle(desk.ch);
  let withDoc = null;
  try { withDoc = JSON.parse(read(desk.mirror, C.TEAM_NAME)); } catch { withDoc = null; }
  const atDesk = !!withDoc && C.canon(withDoc.ring || null) === C.canon(withKey);
  const without = { format: RING.format, kind: RING.kind, keys: [] };
  fs.writeFileSync(at, JSON.stringify(without, null, 1) + "\n");
  await s.runner.sync(); await s.runner.idle();
  const two = await heldTeam(s.mirror, { key: s.keyAt });
  const out = !!two.team && C.canon(two.team.ring || null) === C.canon(without) && two.team.rev > one.team.rev;
  await settle(desk.ch);
  let goneDoc = null;
  try { goneDoc = JSON.parse(read(desk.mirror, C.TEAM_NAME)); } catch { goneDoc = null; }
  const atDeskAfter = !!goneDoc && C.canon(goneDoc.ring || null) === C.canon(without);
  check(folded && atDesk && out && atDeskAfter,
    "rsring a ring with a key at the mirror's root rides inside the next signed team file " + folded + " (rev "
    + (before.team && before.team.rev) + " to " + (one.team && one.team.rev) + ") and reaches the desk " + atDesk
    + ", and a key then taken out is out of the next one " + out + " (rev " + (one.team && one.team.rev) + " to "
    + (two.team && two.team.rev) + "), which the desk holds " + atDeskAfter);
  await desk.ch.stop(); await s.runner.stop();
};

/* Board 962 stage 5, T3 (962s5y and 3.6): the runner's ring rewrite takes the team's lock it is handed (d.teamAct), and the team file
   it writes is kept as teams.json's entry.file, so a kept copy restored later is not refused as older than the floor that write
   raised (Argon's finding 9b). */
LEGS.rs962y = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs962y");
  const asked = [];
  const s = await studioLead(world, lab, { runner: { teamAct: async (team, fn) => { asked.push(team); return fn(); } } });
  await s.runner.sync(); await s.runner.idle();
  const at = path.join(s.mirror, Relay.RING_FILE);
  const withKey = { format: RING.format, kind: RING.kind, keys: [{ keyId: s.lead.keyId, public: s.lead.public, catalogs: ["harbour-lamps"] }] };
  fs.writeFileSync(at, JSON.stringify(withKey, null, 1) + "\n");
  const from = asked.length;
  await s.runner.sync(); await s.runner.idle();
  const held = await heldTeam(s.mirror, { key: s.keyAt });
  const kept = K.keptTeam(s.teamsFile, s.teamId);
  const locked = asked.slice(from).indexOf(s.teamId) >= 0;
  const folded = !!held.team && world.C.canon(held.team.ring || null) === world.C.canon(withKey);
  const keptRev = kept && kept.file ? kept.file.rev : null;
  check(locked && folded && keptRev === (held.team && held.team.rev),
    "rs962y the runner's ring rewrite takes the team's lock " + locked + ", folds the ring " + folded + ", and keeps the file it wrote as"
    + " teams.json's entry.file (kept rev " + keptRev + ", written " + (held.team && held.team.rev) + ")");
  await s.runner.stop();
};

/* Round two of T3: the runner's stale re-read. Another writer moves the team file on between the runner's fresh read and its write (the
   lead's other computer: the same key, no floor beside it); the write is refused as stale, read again once, and lands on top, so both
   changes stand. afterTeamRead is a gate's hook the shell never passes. */
LEGS.rs962z = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs962z");
  const T = await import("../src/team.mjs");
  let other = null, s = null;
  const away = path.join(lab, "other-computer");
  s = await studioLead(world, lab, { runner: { afterTeamRead: async (team, round) => {
    if (round !== 0 || other) return;
    fs.mkdirSync(away, { recursive: true });
    const k2 = path.join(away, "studio-key.json");
    fs.copyFileSync(s.keyAt, k2);
    const t = (await T.heldTeam(s.mirror, { key: k2 })).team;
    other = (await T.writeTeam(s.mirror, T.withExportsSealed(t, !t.exportsSealed), { key: k2, passphrase: labSecret(k2) })).team;
  } } });
  await s.runner.sync(); await s.runner.idle();
  const before = (await heldTeam(s.mirror, { key: s.keyAt })).team;
  const withKey = { format: RING.format, kind: RING.kind, keys: [{ keyId: s.lead.keyId, public: s.lead.public, catalogs: ["harbour-lamps"] }] };
  fs.writeFileSync(path.join(s.mirror, Relay.RING_FILE), JSON.stringify(withKey, null, 1) + "\n");
  await s.runner.sync(); await s.runner.idle();
  const after = (await heldTeam(s.mirror, { key: s.keyAt })).team;
  const kept = K.keptTeam(s.teamsFile, s.teamId);
  const moved = !!other && other.rev === before.rev + 1;
  const both = !!after && world.C.canon(after.ring || null) === world.C.canon(withKey) && !!other && after.exportsSealed === other.exportsSealed
    && after.rev === before.rev + 2;
  const keptRev = kept && kept.file ? kept.file.rev : null;
  check(moved && both && keptRev === (after && after.rev),
    "rs962z the runner's write refused as stale after another writer moved the file on " + moved + " reads it once more and lands on top, both"
    + " changes standing " + both + " (rev " + (before && before.rev) + " to " + (after && after.rev) + "), kept rev " + keptRev);
  await s.runner.stop();
};

LEGS.s3wrap = async () => {
  const world = await relayWorld(), lab = labDir("relay-s3wrap");
  const s = await studioLead(world, lab);
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } },
    "Ada Quay", secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  await s.runner.sync(); await s.runner.idle();
  const reg = invitePosts(s.t)[0] || null;
  const wrap = reg && Array.isArray(reg.add) && reg.add[0] ? reg.add[0].wrap : null;
  const opened = openSpec(secret, s.rt, s.teamId, ri.inv, wrap);
  const pinBytes = reg ? world.core.invitesBytes(s.rt, reg.t, reg.add, reg.drop) : Buffer.alloc(0);
  const bare = reg ? world.core.invitesBytes(s.rt, reg.t, (reg.add || []).map((a) => ({ id: a.id, hash: a.hash })), reg.drop) : Buffer.alloc(0);
  const addOk = !!reg && Array.isArray(reg.add) && reg.add.length === 1 && reg.add[0].id === ri.inv && reg.wraps === undefined
    && !!opened && opened.epoch === s.team.epoch && opened.key === s.teamKey.toString("hex")
    && leadVerifies(s.lead.public, pinBytes, reg.sig) && !leadVerifies(s.lead.public, bare, reg.sig);
  let resealOk = false, capOk = false, why = "no leadInvites";
  if (typeof Relay.leadInvites === "function") {
    const openedLead = Relay.leadOpened(s.keyAt, labSecret(s.keyAt));
    const nextWrap = sealSpec(secret, s.rt, s.teamId, ri.inv, s.team.epoch + 1, crypto.randomBytes(32));
    const call = { url: Relay.RELAY_URL, rt: s.rt, open: openedLead.open, request: s.t.request, t: Math.floor(Date.now()) };
    const sent = await Relay.leadInvites(call, [], [], [{ id: ri.inv, wrap: nextWrap }]);
    const posts = invitePosts(s.t), body = posts[posts.length - 1];
    const ext = body ? Buffer.from("etiuda-relay-invites\n" + s.rt + "\n" + body.t + "\n" + world.core.canon({ add: body.add, drop: body.drop, wraps: body.wraps }), "utf8") : Buffer.alloc(0);
    const pin = body ? world.core.invitesBytes(s.rt, body.t, body.add, body.drop) : Buffer.alloc(0);
    const stored = typeof world.wrapOf === "function" ? world.wrapOf(s.rt, ri.inv) : null;
    resealOk = !!sent && sent.ok === true && !!body && Array.isArray(body.wraps) && body.wraps.length === 1
      && body.wraps[0].id === ri.inv && body.wraps[0].wrap && body.wraps[0].wrap.ct === nextWrap.ct
      && leadVerifies(s.lead.public, ext, body.sig) && !leadVerifies(s.lead.public, pin, body.sig)
      && !!stored && stored.ct === nextWrap.ct && stored.epoch === nextWrap.epoch;
    why = sent && sent.ok ? "accepted" : ("refused " + (sent && sent.reason));
    const huge = { epoch: 1, ct: "ab".repeat(700) };
    const cap = await Relay.leadInvites(Object.assign({}, call, { t: call.t + 1 }), [], [], [{ id: ri.inv, wrap: huge }]);
    const after = typeof world.wrapOf === "function" ? world.wrapOf(s.rt, ri.inv) : null;
    capOk = !!cap && cap.ok === false && !!after && after.ct === nextWrap.ct;
  }
  check(addOk && resealOk && capOk,
    "s3wrap the signed add carries a wrap that opens to this epoch's team key " + addOk
    + ", a re-seal's wraps field is the signed third field and replaces that wrap " + resealOk + " (" + why + ")"
    + ", and a wrap over 1 KiB is refused with the stored wrap unchanged " + capOk);
  await s.runner.stop();
};

LEGS.s3until = async () => {
  const world = await relayWorld(), lab = labDir("relay-s3until");
  const s = await studioLead(world, lab);
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } },
    "Mira Lantern", secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  await s.runner.sync(); await s.runner.idle();
  const reg = invitePosts(s.t)[0] || null;
  const row = reg && Array.isArray(reg.add) ? reg.add[0] : null;
  const want = Date.parse(made.expires);
  const life = Date.parse(made.expires) - Date.parse(made.made);
  const pin = reg ? world.core.invitesBytes(s.rt, reg.t, reg.add, reg.drop) : Buffer.alloc(0);
  const bareAdd = reg ? (reg.add || []).map((a) => { const b = Object.assign({}, a); delete b.until; return b; }) : [];
  const bare = reg ? world.core.invitesBytes(s.rt, reg.t, bareAdd, reg.drop) : Buffer.alloc(0);
  const signed = !!reg && !!row && leadVerifies(s.lead.public, pin, reg.sig) && !leadVerifies(s.lead.public, bare, reg.sig);
  const kept = typeof world.untilOf === "function" ? world.untilOf(s.rt, ri.inv) : null;
  const ok = !!row && row.until === want && life === 7 * 24 * 60 * 60 * 1000 && signed && kept === want;
  check(ok, "s3until the signed add carries the invitation's end " + (row ? row.until : "none")
    + " which is its life " + want + " (" + (life / 86400000) + " days), the signature covers that end " + signed
    + ", and the relay keeps it " + kept);
  await s.runner.stop();
};

LEGS.s3move = async () => {
  const world = await relayWorld(), lab = labDir("relay-s3move");
  const s = await studioLead(world, lab);
  const kept = (name, expires) => {
    const secret = newSecret(), ri = Relay.relayInvite(secret);
    const made = makeInvite({ team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } },
      name, secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
    K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made,
      expires: expires || made.expires, name: made.name, relay: ri });
    return { secret, ri, made };
  };
  const unused = kept("Ada Quay");
  const opened = kept("Mira Lantern");
  const dropped = kept("Nera Quay");
  const ended = kept("Lumen Quay", new Date(Date.now() - 60000).toISOString());
  await s.runner.sync(); await s.runner.idle();
  const rec = world.store(s.rt).get("inv:" + opened.ri.inv);
  world.store(s.rt).put("inv:" + opened.ri.inv, Object.assign({}, rec, { spent: true, spentAt: Date.now() }));
  K.endInvite(s.teamsFile, s.teamId, dropped.made.id, "withdrawn");
  const h = await heldTeam(s.mirror, { key: s.keyAt });
  const next = await newEpoch(h.team, { key: s.keyAt, secret: labSecret(s.keyAt) });
  await writeTeam(s.mirror, next.team, { key: s.keyAt, passphrase: labSecret(s.keyAt) });
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, next.team.epoch, next.teamKey);
  const sentBefore = invitePosts(s.t).length;
  await s.runner.sync(); await s.runner.idle();
  /* The move's sync: the drop in a call of its own (board 987), then the re-seal. */
  const moved = invitePosts(s.t).slice(sentBefore), body = moved[moved.length - 1] || null;
  const dropsFirst = moved.length === 2 && !!moved[0] && (moved[0].add || []).length === 0 && moved[0].wraps === undefined
    && !!body && (body.drop || []).length === 0;
  const wraps = body && Array.isArray(body.wraps) ? body.wraps : [];
  const wrapFor = (id) => { const w = wraps.find((x) => x.id === id); return w ? w.wrap : null; };
  const keyHex = next.teamKey.toString("hex");
  const openUnused = openSpec(unused.secret, s.rt, s.teamId, unused.ri.inv, wrapFor(unused.ri.inv));
  const openOpened = openSpec(opened.secret, s.rt, s.teamId, opened.ri.inv, wrapFor(opened.ri.inv));
  const dropIds = moved.length && moved[0] && Array.isArray(moved[0].drop) ? moved[0].drop : [];
  const resealed = dropsFirst && !!openUnused && openUnused.epoch === next.team.epoch && openUnused.key === keyHex
    && !!openOpened && openOpened.epoch === next.team.epoch && openOpened.key === keyHex
    && wraps.every((w) => w.id !== dropped.ri.inv && w.id !== ended.ri.inv)
    && dropIds.indexOf(dropped.ri.inv) >= 0 && dropIds.indexOf(ended.ri.inv) < 0;
  const sentUnused = wrapFor(unused.ri.inv), sentOpened = wrapFor(opened.ri.inv);
  const storedUnused = world.wrapOf(s.rt, unused.ri.inv), storedOpened = world.wrapOf(s.rt, opened.ri.inv);
  const oneEach = !!sentUnused && !!storedUnused && storedUnused.ct === sentUnused.ct && storedUnused.epoch === next.team.epoch
    && !!sentOpened && !!storedOpened && storedOpened.ct === sentOpened.ct && world.wrapOf(s.rt, dropped.ri.inv) == null;
  const book = K.inviteBookOf(s.teamsFile, s.vault);
  const forgotten = !(book[ended.made.id] && book[ended.made.id].secret);
  const still = !!(book[opened.made.id] && book[opened.made.id].secret === opened.secret)
    && !!(book[unused.made.id] && book[unused.made.id].secret === unused.secret);
  check(resealed && oneEach, "s3move an epoch move re-seals the unused and the opened invitation at the new key " + resealed
    + " (wraps " + wraps.length + ", drop " + dropIds.length + " in a call of its own ahead of them), one wrap each and none for the one dropped in that sync " + oneEach);
  check(forgotten && still, "s3move the invitation past its end has lost its secret " + forgotten
    + ", and the unused and the opened ones still keep theirs " + still);
  await s.runner.stop();
};

LEGS.s3name = async () => {
  const world = await relayWorld(), lab = labDir("relay-s3name");
  const s = await studioLead(world, lab);
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const made = makeInvite({ team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } },
    "Mira Lantern", secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires,
    name: made.name, person: "Piotr Quay", relay: ri });
  await s.runner.sync(); await s.runner.idle();
  const row = K.invitesOf(s.teamsFile, s.teamId).find((i) => i.id === made.id) || {};
  const doc = JSON.parse(Buffer.from(made.blob.slice("etiuda-join:".length), "base64url").toString("utf8"));
  const link = typeof made.link === "string" ? made.link : "";
  const held = world.relayText(s.rt) + "\n" + s.t.sent.join("\n");
  const who = deskKeys();
  put(s.mirror, "desks/" + who.keyId + "/join.json", JSON.stringify(joinRequest(s.teamId, who, { id: made.id, secret })) + "\n");
  const Join = await import("../src/join.mjs");
  const ask = Join.listJoins(s.mirror, s.team, { invites: K.inviteBookOf(s.teamsFile, s.vault) }).find((r) => r.id === who.keyId) || {};
  const bookHas = row.person === "Piotr Quay";
  const absent = doc.person === undefined && JSON.stringify(doc).indexOf("Piotr Quay") < 0 && link.indexOf("Piotr") < 0
    && held.indexOf("Piotr Quay") < 0 && held.indexOf("Quay Desk") < 0;
  const arrived = ask.inviteId === made.id && ask.name === "Quay Desk";
  check(bookHas && absent && arrived, "s3name the person's name is in Studio's book " + bookHas
    + " and in neither the link nor what the relay holds or was sent " + absent
    + ", and the desk's request arrives under its own name " + arrived);
  const spend = world.transport("s3name-spend");
  const helloRes = await spend.request("POST", Relay.RELAY_URL + "/t/" + s.rt + "/hello",
    { "content-type": "application/json" }, Buffer.from("{}"));
  const hello = JSON.parse(helloRes.bytes.toString("utf8"));
  await spend.request("POST", Relay.RELAY_URL + "/t/" + s.rt + "/session", { "content-type": "application/json" },
    Buffer.from(JSON.stringify(boundToken(world, s.rt, hello.challenge, ri.inv, ri.token))));
  const spent = world.store(s.rt).get("inv:" + ri.inv) || {};
  await s.runner.sync(); await s.runner.idle();
  const rec = Object.assign({}, spent, { uploaded: true });
  delete rec.spentAt;
  world.store(s.rt).put("inv:" + ri.inv, rec);
  await s.runner.sync(); await s.runner.idle();
  const again = K.relayInvitesOf(s.teamsFile, s.vault, s.teamId).find((i) => i.id === made.id) || {};
  const timeOk = Number.isFinite(spent.spentAt) && again.relayUsed === spent.spentAt && again.relayState === "asked";
  check(timeOk, "s3name the relay's first use stays at the relay's time " + (again.relayUsed == null ? "none" : again.relayUsed)
    + " after the upload (the relay's " + (spent.spentAt == null ? "none" : spent.spentAt) + ", state " + (again.relayState || "none") + ")");
  await s.runner.stop();
};

LEGS.s3row = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const Studio = await import("../src/studio.mjs");
  const lab = labDir("relay-s3row");
  const born = await Studio.newProject(lab, "Harbour Lamps", ["en"]);
  const dir = born && born.dir ? born.dir : born;
  const open = JSON.parse(JSON.stringify(await Studio.openProject(dir)));
  const usedAt = Date.parse("2026-10-18T14:05:00.000Z");
  const when = "\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}";
  const ENT = { "&#39;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&amp;": "&" };
  const text = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m]).replace(/\s+/g, " ").trim();
  const payload = { error: null, folder: dir, id: "harbour-lamps", mark: null, signing: "studio-harbour", file: "ours",
    reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, requests: [], autoAdmit: false, keyOpens: true,
    inviteName: "Mira Lantern", invites: [{ id: "0123456789abcdef", name: "Mira Lantern", person: "Piotr Quay",
      made: "2026-10-13T08:00:00.000Z", expires: "2026-10-20T08:00:00.000Z", code: "04913",
      relay: true, used: usedAt, deskName: "Desk Nine" }],
    team: { id: "t-0123456789abcdef", epoch: 1, relay: true, sealed: true, lists: true, exportsSealed: true, roster: [], recovery: false, leadPrint: "abcd" } };
  const api = { desks: async () => JSON.parse(JSON.stringify(payload)) };
  const paint = async (lang) => {
    const home = loadPage({ api, uiLang: lang });
    Object.assign(home.page.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
    await home.page.desksLoad();
    return text(home.node("#main").innerHTML);
  };
  const te = await paint("en"), tp = await paint("pl");
  const enOk = /Piotr Quay/.test(te) && new RegExp("Made " + when).test(te) && new RegExp("Valid until " + when).test(te)
    && new RegExp("The relay says it was first used at " + when).test(te)
    && /The teammate's own name: Desk Nine/.test(te) && te.indexOf("04913") < 0;
  const plOk = /Piotr Quay/.test(tp) && new RegExp("Wystawione " + when).test(tp) && new RegExp("Ważne do " + when).test(tp)
    && /Według przekaźnika pierwsze użycie:/.test(tp) && /Nazwa podana przez członka zespołu: Desk Nine/.test(tp)
    && !/The relay says|The desk's own name|check code|Made |Valid until/.test(tp);
  check(enOk && plOk, "s3row the Desks row keeps the relay's first use beside the desk's own name, in English " + enOk
    + " and in Polish " + plOk);
};

/* A Cancel whose drop answer names the invitation as used: one confirm, then one epoch move, and the other invitation
   re-sealed in that move. The page's half is the same confirm, once, in English and in Polish. */
LEGS.s3cancel = async () => {
  const world = await relayWorld(), lab = labDir("relay-s3cancel");
  const s = await studioLead(world, lab);
  let staleOk = false, epochSeen = "none", wrapCount = 0, postCount = 0, why = "no cancel";
  try {
    const kept = (name) => {
      const secret = newSecret(), ri = Relay.relayInvite(secret);
      const made = makeInvite({ team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } },
        name, secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
      K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires,
        name: made.name, relay: ri });
      return { secret, ri, made };
    };
    const quiet = kept("Ada Quay");
    const spent = kept("Mira Lantern");
    const spare = kept("Nera Quay");
    await s.runner.sync(); await s.runner.idle();
    const spend = world.transport("s3cancel-spend");
    const helloRes = await spend.request("POST", Relay.RELAY_URL + "/t/" + s.rt + "/hello",
      { "content-type": "application/json" }, Buffer.from("{}"));
    const hello = JSON.parse(helloRes.bytes.toString("utf8"));
    await spend.request("POST", Relay.RELAY_URL + "/t/" + s.rt + "/session", { "content-type": "application/json" },
      Buffer.from(JSON.stringify(boundToken(world, s.rt, hello.challenge, spent.ri.inv, spent.ri.token))));
    const heldBefore = world.wrapOf(s.rt, spent.ri.inv);
    const fn = Relay.cancelInvitation, note = Relay.noteCancel;
    if (typeof fn !== "function" || typeof note !== "function") {
      why = "no cancel, and the opened wrap is " + (heldBefore ? "still held" : "already gone");
    } else {
      const opened = Relay.leadOpened(s.keyAt, labSecret(s.keyAt));
      const callOf = () => ({ url: Relay.RELAY_URL, rt: s.rt, open: opened.open, request: s.t.request, t: Math.floor(Date.now()) });
      const unused = await fn({ call: callOf(), id: quiet.ri.inv, confirm: false });
      const unusedOk = !!unused && unused.ok === true && unused.needsConfirm === false && unused.moveNow === false
        && unused.dropNow === true && (unused.used || []).indexOf(quiet.ri.inv) < 0;
      if (unusedOk) note(s.teamsFile, s.teamId, quiet.made.id, unused);
      const before = invitePosts(s.t).length;
      const first = await fn({ call: callOf(), id: spent.ri.inv, confirm: false });
      const asked = !!first && first.ok === true && first.needsConfirm === true && first.dropNow === true && first.moveNow === false
        && (first.used || []).indexOf(spent.ri.inv) >= 0 && invitePosts(s.t).length === before + 1;
      const wrapGone = world.wrapOf(s.rt, spent.ri.inv) == null;
      const early = await heldTeam(s.mirror, { key: s.keyAt });
      const stillOne = !!early.team && early.team.epoch === 1;
      if (unusedOk && asked && wrapGone && stillOne) note(s.teamsFile, s.teamId, spent.made.id, first);
      const atDismiss = invitePosts(s.t).length;
      const dismissed = asked ? await fn({ call: callOf(), id: spent.ri.inv, confirm: false, pending: true }) : null;
      const dismissOk = !!dismissed && dismissed.needsConfirm === true && dismissed.moveNow === false && dismissed.dropNow === false
        && invitePosts(s.t).length === atDismiss;
      const yes = dismissOk ? await fn({ call: callOf(), id: spent.ri.inv, confirm: true, pending: true }) : null;
      const confirmOk = !!yes && yes.moveNow === true && yes.dropNow === false && yes.needsConfirm === false
        && invitePosts(s.t).length === atDismiss;
      let movedOk = false, resealed = false;
      if (unusedOk && asked && wrapGone && stillOne && dismissOk && confirmOk && typeof (await import("../src/studio.mjs")).moveEpoch === "function") {
        const Studio = await import("../src/studio.mjs");
        const born = await Studio.newProject(path.join(lab, "projects"), "Harbour Lamps", ["en"]);
        const dir = born && born.dir ? born.dir : born;
        await Studio.setPublishFolder(dir, s.mirror);
        const nextKey = crypto.randomBytes(32);
        K.keepTeamKey(s.teamsFile, s.vault, s.teamId, 2, nextKey);
        const moved = await Studio.moveEpoch(dir, s.keyAt, s.teamId, labSecret(s.keyAt), { confirm: true, nextKey, nextEpoch: 2,
          teamKeys: K.teamKeysOf(s.teamsFile, s.vault) });
        if (moved && moved.teamKey) K.keepTeamKey(s.teamsFile, s.vault, s.teamId, moved.epoch, Buffer.from(moved.teamKey));
        K.markRelayInvite(s.teamsFile, s.teamId, spent.made.id, { pendingMove: false });
        await s.runner.sync(); await s.runner.idle();
        const posts = invitePosts(s.t), body = posts[posts.length - 1] || null;
        const wraps = body && Array.isArray(body.wraps) ? body.wraps : [];
        const dropIds = body && Array.isArray(body.drop) ? body.drop : [];
        wrapCount = wraps.length;
        postCount = posts.length - atDismiss;
        const keyHex = Buffer.from(moved && moved.teamKey ? moved.teamKey : nextKey).toString("hex");
        const openSpare = openSpec(spare.secret, s.rt, s.teamId, spare.ri.inv, (wraps.find((w) => w.id === spare.ri.inv) || {}).wrap);
        epochSeen = moved && moved.epoch;
        const book = K.inviteBookOf(s.teamsFile, s.vault);
        const forgot = !(book[quiet.made.id] && book[quiet.made.id].secret)
          && !(book[spent.made.id] && book[spent.made.id].secret)
          && !!(book[spare.made.id] && book[spare.made.id].secret === spare.secret);
        movedOk = epochSeen === 2 && (early.team.roster || []).length === ((moved.team && moved.team.roster) || []).length && forgot;
        resealed = !!openSpare && openSpare.epoch === 2 && openSpare.key === keyHex
          && wraps.every((w) => w.id !== spent.ri.inv && w.id !== quiet.ri.inv)
          && dropIds.indexOf(spent.ri.inv) < 0 && world.wrapOf(s.rt, spent.ri.inv) == null
          && postCount === 1;
      }
      staleOk = unusedOk && asked && wrapGone && stillOne && dismissOk && confirmOk && movedOk && resealed;
      if (!staleOk) why = "unused " + unusedOk + ", asked " + asked + ", wrap gone " + wrapGone + ", epoch held " + stillOne
        + ", dismiss " + dismissOk + ", confirm " + confirmOk + ", moved " + movedOk + ", resealed " + resealed;
      else why = "";
    }
  } catch (e) {
    why = e && e.message ? e.message : String(e);
    staleOk = false;
  } finally {
    try { await s.runner.stop(); } catch { /* the runner had not started */ }
  }
  check(staleOk, "s3cancel a Cancel answered used drops at once, asks once, and one confirm moves the epoch " + staleOk
    + " (epoch " + epochSeen + ", wraps " + wrapCount + ", posts after the confirm " + postCount + ")"
    + (why ? ": " + why : ""));

  let pageOk = false, pageWhy = "no confirm";
  try {
    const { loadPage } = await import("./page-stand-in.mjs");
    const Studio = await import("../src/studio.mjs");
    const born = await Studio.newProject(path.join(lab, "page"), "Harbour Lamps", ["en"]);
    const dir = born && born.dir ? born.dir : born;
    const open = JSON.parse(JSON.stringify(await Studio.openProject(dir)));
    const inviteId = "0123456789abcdef", member = "k-e5c80a17b2e4d856";
    const paintOne = async (lang) => {
      let pending = false;
      const calls = [];
      const invite = () => ({ id: inviteId, name: "Mira Lantern", person: "Piotr Quay", made: "2026-10-13T08:00:00.000Z",
        expires: "2026-10-20T08:00:00.000Z", code: "", relay: true, used: null, deskName: "", pendingMove: pending });
      const screen = () => ({ error: null, folder: dir, id: "harbour-lamps", mark: null, signing: "studio-harbour", file: "ours",
        reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, requests: [], autoAdmit: false, keyOpens: true,
        inviteName: "Mira Lantern", invites: pending ? [invite()] : [invite()],
        team: { id: "t-0123456789abcdef", epoch: 1, relay: true, sealed: true, lists: true, exportsSealed: true, recovery: false, leadPrint: "abcd",
          roster: [{ id: member, name: "Ewa's desk", own: "", key: "e5c80a17b2e4d856", admitted: true, kind: "desk", door: "invitation" }] } });
      const api = {
        desks: async () => JSON.parse(JSON.stringify(screen())),
        inviteCancel: async (d, id, confirm) => {
          calls.push({ d, id, confirm });
          if (confirm !== true) { pending = true; return JSON.parse(JSON.stringify(Object.assign(screen(), { needsConfirm: true }))); }
          pending = false;
          const done = screen();
          done.invites = [];
          return JSON.parse(JSON.stringify(Object.assign(done, { needsConfirm: false, moved: true })));
        },
      };
      const home = loadPage({ api, uiLang: lang });
      Object.assign(home.page.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
      await home.page.desksLoad();
      return { home, calls };
    };
    const en = await paintOne("en");
    const Pg = en.home.page;
    const cancel = Pg.ACTS["invite-cancel"], again = Pg.ACTS["invite-cancel-open"], go = Pg.ACTS["do-invite-cancel"];
    if (typeof cancel !== "function" || typeof again !== "function" || typeof go !== "function") {
      pageWhy = "the page has no cancel";
    } else {
      const html = en.home.node("#main").innerHTML;
      const row = html.indexOf('data-act="invite-cancel" data-id="' + inviteId + '"') > 0
        && html.indexOf('data-act="invite-withdraw" data-id="' + inviteId + '"') < 0
        && html.indexOf('data-act="member-remove" data-id="' + member + '"') > 0;
      await cancel({ getAttribute: () => inviteId });
      const dlg = en.home.node("#dlg").innerHTML;
      const ENT = { "&#39;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&amp;": "&" };
      const text = (h) => String(h).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m]).replace(/\s+/g, " ").trim();
      const once = (dlg.match(/<h2>/g) || []).length === 1
        && /Cancel this invitation\?/.test(text(dlg))
        && /A teammate has already opened it and holds the team's key/.test(text(dlg))
        && /data-act="do-invite-cancel"/.test(dlg) && /Move the team to a new key/.test(text(dlg));
      const firstCall = en.calls.length === 1 && en.calls[0].confirm === false && en.calls[0].id === inviteId;
      await Pg.ACTS["cover-close"]();
      const dismissed = en.calls.length === 1 && Pg.S.cover === null;
      await again({ getAttribute: () => inviteId });
      const reopened = en.calls.length === 1 && Pg.S.cover === "team";
      await go();
      const confirmed = en.calls.length === 2 && en.calls[1].confirm === true && en.calls[1].d === dir && Pg.S.cover === null
        && /The invitation is cancelled; anyone who opens its link is told it has already been used\./.test(text(en.home.node("#main").innerHTML));
      const pl = await paintOne("pl");
      const Q = pl.home.page;
      await Q.ACTS["invite-cancel"]({ getAttribute: () => inviteId });
      const polish = text(pl.home.node("#dlg").innerHTML);
      const plOk = /Anulować to zaproszenie\?/.test(polish) && /Przenieś zespół na nowy klucz/.test(polish)
        && /Członek zespołu już je otworzył/.test(polish)
        && !/Cancel this invitation\?|Move the team to a new key|A teammate has already opened it/.test(polish);
      pageOk = row && once && firstCall && dismissed && reopened && confirmed && plOk;
      if (!pageOk) pageWhy = "row " + row + ", one cover " + once + ", first " + firstCall + ", dismiss " + dismissed
        + ", again " + reopened + ", confirm " + confirmed + ", polish " + plOk;
      else pageWhy = "";
    }
  } catch (e) {
    pageWhy = e && e.message ? e.message : String(e);
    pageOk = false;
  }
  check(pageOk, "s3cancel the page asks once and a joined desk stays Remove " + pageOk + (pageWhy ? ": " + pageWhy : ""));
};

/* The link a relay team gives out. The fragment is the invitation document, the blob stays etiuda-join:, and a folder
   invitation has no link. The shell copies the link where there is one. */
LEGS.s3link = async () => {
  const world = await relayWorld(), lab = labDir("relay-s3link");
  const s = await studioLead(world, lab);
  let ok = false, why = "no link";
  try {
    const Invite = await import("../src/invite.mjs");
    const target = { team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } };
    const secret = newSecret(), ri = Relay.relayInvite(secret);
    const relayMade = Invite.makeInvite(target, "Mira Lantern", secret, Date.now(), undefined,
      { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
    let folderRefused = false;
    try { Invite.makeInvite(target, "Mira Lantern", newSecret()); } catch { folderRefused = true; }
    const payload = relayMade.blob.indexOf("etiuda-join:") === 0 ? relayMade.blob.slice("etiuda-join:".length) : "";
    const link = typeof relayMade.link === "string" ? relayMade.link : "";
    const doc = payload ? JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) : {};
    const shaped = link === "https://etiuda.dev/join#" + payload && link.indexOf("?") < 0
      && relayMade.blob === "etiuda-join:" + payload
      && doc.secret === secret && doc.relay && doc.relay.rt === s.rt && doc.relay.inv === ri.inv;
    const shell = fs.readFileSync(path.join(ROOT, "shell/main.js"), "utf8");
    const writes = (shell.match(/clipboard\.writeText\(I\.clipText\(/g) || []).length === 2;
    const bareMade = { blob: relayMade.blob, link: "" };
    const clip = typeof Invite.clipText === "function" && Invite.clipText(relayMade) === relayMade.link
      && Invite.clipText(relayMade, "text") === relayMade.blob && Invite.clipText(bareMade) === bareMade.blob
      && Invite.clipText(bareMade, "text") === bareMade.blob;
    ok = shaped && folderRefused && writes && clip;
    why = ok ? "" : "shaped " + shaped + ", folderRefused " + folderRefused + ", clipboard " + writes + ", clip " + clip
      + (link ? "" : ", link empty");
  } catch (e) {
    why = e && e.message ? e.message : String(e);
    ok = false;
  } finally {
    try { await s.runner.stop(); } catch { /* the runner had not started */ }
  }
  check(ok, "s3link a relay invitation's link is the https fragment and the etiuda-join: text stays " + ok
    + (why ? ": " + why : ""));
};

/* THE SHELL'S OWN CANCEL (studio:invite-cancel), driven as Electron drives it, with no window: the handler is shell/main.js's,
   the thread's verbs are src/studio.mjs's run in this process, and the relay is the lab's, reached through the shell's own wire
   (net.fetch answered by a lab transport). The other legs of slice 3 drive the page against a stub, or the library's decision
   on its own; none of them reaches the handler that takes the decision, moves the team and keeps the book. The invitations
   are made here as the lab makes them and registered by the shell's own first sync. */
/* A lead signed in, the path a customer walks: with a provider offered, a Studio nobody signed in to holds publishing to a team,
   statistics and proposals (night decision 16; sign-in.mjs si77 and licence-studio ls16a hold that state). */
const signedIn = (ud) => fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft" }));
async function shellLead(world, lab, o) {
  const x = o || {}, ud = path.join(lab, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const keyAt = path.join(ud, "signing-key.json");
  const lead = await labLeadKey();
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  granted(keyAt, lead.public);
  const teamsFile = K.teamsFile(ud), vault = shellVault(), rt = Relay.relayId(), teamId = "t-" + hex(8);
  const teamKey = crypto.randomBytes(32);
  K.keepTeamKey(teamsFile, vault, teamId, 1, teamKey);
  /* `x.folder` makes the other kind of team, a shared folder with no relay, for the legs that set the two side by side. */
  const mirror = x.folder ? path.join(lab, "share") : K.keepRelay(teamsFile, teamId, rt, Relay.RELAY_URL);
  const Studio = await import("../src/studio.mjs");
  const born = await Studio.newProject(path.join(lab, "projects"), "Harbour Lamps", ["en"]);
  const dir = born && born.dir ? born.dir : born;
  await Studio.setPublishFolder(dir, mirror);
  let team = newTeam({ id: teamId, catalogs: [born && born.draft && born.draft.id ? born.draft.id : "harbour-lamps"],
    lead: { keyId: lead.keyId, public: lead.public }, sealed: true, exportsSealed: true });
  /* `x.roster` desks are on the team with a wrap of its key, as in studioLead. */
  for (const d of x.roster || []) {
    team = withDesk(team, { id: d.keyId, key: d.pub, box: d.box.pub });
    team.roster.find((e) => e.desk.id === d.keyId).wrap = Engine.hpkeRules().wrapTeamKey(teamKey, d.box.pub, teamId, 1, d.keyId);
  }
  if (!x.folder) team = withChannel(team, { kind: "relay", rt, url: Relay.RELAY_URL }, RING);
  /* `x.recovery` wraps the team key under the signing key, as a team this Studio wrote does, so a backup of that key can carry it. */
  if (x.recovery) team = withRecovery(team, teamKey, recoveryOf(keyAt, labSecret(keyAt)));
  fs.mkdirSync(mirror, { recursive: true });
  const written = (await writeTeam(mirror, team, { key: keyAt, passphrase: labSecret(keyAt) })).team;
  K.chooseSealed(teamsFile, teamId, true, mirror, written);
  const target = { team: teamId, folder: mirror, lead: { keyId: lead.keyId, public: lead.public } };
  const inv = (x.invitations || []).map((name) => {
    const secret = newSecret(), ri = Relay.relayInvite(secret);
    const made = makeInvite(target, name, secret, Date.now(), undefined, { rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
    K.keepInvite(teamsFile, vault, teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
    return { name, secret, ri, made };
  });
  const t = world.transport("shell"), moves = [], admitted = [], hooks = {};
  /* `hooks.teamFacts`, where a leg sets one, runs once, before the next look at the team by the thread. */
  const thread = async (verb, ...a) => {
    if (verb === "teamFacts" && typeof hooks.teamFacts === "function") { const once = hooks.teamFacts; hooks.teamFacts = null; await once(); }
    if (verb === "watchAdmit" && (x.verbs || []).indexOf(verb) >= 0) {
      const r = await Studio.watchAdmit(...a);
      for (const id of (r && Array.isArray(r.admitted) ? r.admitted : [])) admitted.push(id);
      return r;
    }
    if (verb === "inviteTarget" || verb === "teamFacts" || (x.verbs || []).indexOf(verb) >= 0) return Studio[verb](...a);
    if (verb === "moveTeamKey") {
      moves.push(a);
      const r = await Studio.moveEpoch(...a);
      if (x.throwAfterMove) throw new Error("the reply did not come back");
      return r;
    }
    return {};
  };
  const shell = await loadStudioShell(ud, { relay: t, thread,
    env: Object.assign({ STUDIO_PROJECTS: path.join(lab, "projects"), STUDIO_SIGNING_KEY: keyAt, STUDIO_RELAY_ROOT: GRANT_ROOT_PUB },
      x.backupFile ? { STUDIO_TEST_BACKUP: x.backupFile } : {}) });
  const S = { world, lab, ud, keyAt, lead, teamsFile, vault, rt, teamId, teamKey, mirror, dir, inv, t, moves, shell, admitted, hooks };
  S.restart = async () => {
    await S.shell.done();
    S.shell = await loadStudioShell(ud, { relay: t, thread,
      env: Object.assign({ STUDIO_PROJECTS: path.join(lab, "projects"), STUDIO_SIGNING_KEY: keyAt, STUDIO_RELAY_ROOT: GRANT_ROOT_PUB },
        x.backupFile ? { STUDIO_TEST_BACKUP: x.backupFile } : {}) });
    return S.shell;
  };
  S.cancel = (i, confirm) => S.shell.ask("studio:invite-cancel", dir, i.made.id, confirm);
  S.posts = () => invitePosts(t);
  S.epoch = async () => { const h = await heldTeam(mirror, { key: keyAt }); return h.team ? h.team.epoch : 0; };
  S.relayRow = (i) => K.relayInvitesOf(teamsFile, vault, teamId).find((r) => r.id === i.made.id) || null;
  S.row = (i) => K.invitesOf(teamsFile, teamId).find((r) => r.id === i.made.id) || null;
  S.secretOf = (i) => { const b = K.inviteBookOf(teamsFile, vault)[i.made.id]; return b && b.secret ? b.secret : ""; };
  S.keyAt2 = () => { const k = K.teamKeysOf(teamsFile, vault)[teamId] || {}; return k[2] ? Buffer.from(k[2]).toString("hex") : ""; };
  S.registered = () => inv.every((i) => !!world.store(rt) && !!world.store(rt).get("inv:" + i.ri.inv));
  S.heard = () => inv.every((i) => { const r = S.relayRow(i); return !!r && (r.gone || r.relayState === "unused"); });
  /* A desk's first use of an invitation, as the lab's relay takes it: a hello, and a session opened with the token. */
  S.spend = async (i) => {
    const sp = world.transport("spend-" + hex(3)), json = { "content-type": "application/json" };
    const res = await sp.request("POST", Relay.RELAY_URL + "/t/" + rt + "/hello", json, Buffer.from("{}"));
    const hello = JSON.parse(res.bytes.toString("utf8"));
    await sp.request("POST", Relay.RELAY_URL + "/t/" + rt + "/session", json,
      Buffer.from(JSON.stringify(boundToken(world, rt, hello.challenge, i.ri.inv, i.ri.token))));
    const rec = world.store(rt).get("inv:" + i.ri.inv);
    return !!rec && rec.spent === true;
  };
  /* The window's focus runs the watch, and the watch ends in a relay sync: the way to ask the shell for one. */
  S.sync = async (done) => { await S.shell.fire("focus"); return until(done, 20000); };
  return S;
}
const wrapsOf = (posts) => posts.filter((p) => p && Array.isArray(p.wraps)).flatMap((p) => p.wraps);
const dropsOf = (posts) => posts.filter((p) => p && Array.isArray(p.drop)).flatMap((p) => p.drop);

/* An unused invitation is dropped at the relay and moves nothing. A row the book already calls used asks for the confirm and,
   without it, moves nothing and posts nothing; with it the team moves once, the invitation has no secret and no mark, and
   the next sync's signed call drops it and carries no wrap for it. */
LEGS.s3shell = async () => {
  const world = await relayWorld(), lab = labDir("relay-s3shell");
  const S = await shellLead(world, lab, { invitations: ["Ada Quay", "Mira Lantern", "Nera Quay"] });
  const [A, B, C] = S.inv;
  let why = "";
  try {
    const settled = await until(() => S.registered() && S.heard(), 20000);
    if (!settled) why = "the shell's first sync did not register and hear the invitations";
    const fromA = S.posts().length;
    const a = settled ? await S.cancel(A, false) : null;
    const dropA = S.posts().slice(fromA);
    const rowA = S.relayRow(A);
    const unusedOk = !!a && a.error === null && a.moved === false && a.needsConfirm === false && S.moves.length === 0
      && (await S.epoch()) === 1 && dropsOf(dropA).indexOf(A.ri.inv) >= 0
      && !world.store(S.rt).get("inv:" + A.ri.inv) && world.wrapOf(S.rt, A.ri.inv) == null
      && S.row(A).state === "withdrawn" && !S.secretOf(A) && !!rowA && rowA.gone === true && rowA.pendingMove === false
      && !!S.secretOf(B) && !!S.secretOf(C);
    check(unusedOk, "s3shell an unused invitation is dropped at the relay and the team does not move " + unusedOk
      + (a ? " (moved " + a.moved + ", ask " + a.needsConfirm + ", moves " + S.moves.length + ", error " + JSON.stringify(a.error) + ")" : "")
      + (why ? ": " + why : ""));

    const used = await S.spend(B);
    const known = used && await S.sync(() => { const r = S.relayRow(B); return !!r && r.relayState === "used"; });
    const fromB = S.posts().length;
    const quiet = known ? await S.cancel(B, false) : null;
    const quietToo = known ? await S.cancel(B, undefined) : null;
    const quietOk = !!quiet && !!quietToo && quiet.error === null && quiet.needsConfirm === true && quiet.moved === false
      && quietToo.needsConfirm === true && quietToo.moved === false && S.moves.length === 0 && (await S.epoch()) === 1
      && S.posts().length === fromB && S.row(B).state === "live" && !!S.secretOf(B) && S.row(B).pendingMove === false
      && !!world.store(S.rt).get("inv:" + B.ri.inv);
    check(quietOk, "s3shell a row the book calls used, pressed without the confirm, asks and moves nothing and posts nothing " + quietOk
      + (quiet ? " (ask " + quiet.needsConfirm + ", moved " + quiet.moved + ", moves " + S.moves.length + ", new posts " + (S.posts().length - fromB) + ")"
        : " (spent " + used + ", heard " + known + ")"));

    const fromMove = S.posts().length;
    const done = quietOk ? await S.cancel(B, true) : null;
    const epoch2 = (await S.epoch()) === 2;
    const wrapped = quietOk ? await until(() => { const w = world.wrapOf(S.rt, C.ri.inv); return !!w && w.epoch === 2; }, 20000) : false;
    const sent = S.posts().slice(fromMove), keyHex = S.keyAt2();
    const wrapC = wrapsOf(sent).find((w) => w.id === C.ri.inv);
    const openC = wrapC ? openSpec(C.secret, S.rt, S.teamId, C.ri.inv, wrapC.wrap) : null;
    const moveOk = !!done && done.error === null && done.needsConfirm === false && done.moved === true && S.moves.length === 1 && epoch2
      && S.row(B).state === "withdrawn" && !S.secretOf(B) && S.row(B).pendingMove === false
      && !(done.invites || []).some((r) => r.id === B.made.id) && !!S.secretOf(C);
    check(moveOk, "s3shell the confirm moves the team once, and the invitation has no secret and no mark afterwards " + moveOk
      + (done ? " (moved " + done.moved + ", moves " + S.moves.length + ", epoch 2 " + epoch2 + ")" : ""));
    const nextOk = wrapped && dropsOf(sent).indexOf(B.ri.inv) >= 0 && wrapsOf(sent).every((w) => w.id !== B.ri.inv)
      && world.wrapOf(S.rt, B.ri.inv) == null && !!openC && openC.epoch === 2 && !!keyHex && openC.key === keyHex;
    check(nextOk, "s3shell the next sync's signed call drops the cancelled invitation with no wrap for it, and seals the new key to the one left "
      + nextOk + " (wrapped " + wrapped + ", drops " + dropsOf(sent).length + ", wraps " + wrapsOf(sent).length + ")");
  } catch (e) {
    check(false, "s3shell threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally { S.shell.done(); }
};

/* A cancel the relay answers as used drops at once and asks once; asked again it asks again and posts nothing; the confirm
   moves the team once, the page's mark is cleared, and the next sync seals the new key to the invitations left and to
   the cancelled one never. */
LEGS.s3shellused = async () => {
  const world = await relayWorld(), lab = labDir("relay-s3shellused");
  const S = await shellLead(world, lab, { invitations: ["Ada Quay", "Mira Lantern", "Nera Quay"] });
  const [A, B, C] = S.inv;
  let why = "";
  try {
    const settled = await until(() => S.registered() && S.heard(), 20000);
    const used = settled && await S.spend(A);
    if (!used) why = "the first sync did not settle, or the invitation was not used";
    const fromFirst = S.posts().length;
    const first = used ? await S.cancel(A, false) : null;
    const dropped = S.posts().slice(fromFirst);
    const askedOk = !!first && first.error === null && first.needsConfirm === true && first.moved === false && S.moves.length === 0
      && (await S.epoch()) === 1 && dropsOf(dropped).indexOf(A.ri.inv) >= 0 && world.wrapOf(S.rt, A.ri.inv) == null
      && S.row(A).state === "withdrawn" && !S.secretOf(A) && S.row(A).pendingMove === true
      && (first.invites || []).some((r) => r.id === A.made.id && r.pendingMove === true);
    check(askedOk, "s3shellused a cancel the relay answers as used drops the invitation and asks once, and the team has not moved " + askedOk
      + (first ? " (ask " + first.needsConfirm + ", moved " + first.moved + ", moves " + S.moves.length + ", error " + JSON.stringify(first.error) + ")" : "")
      + (why ? ": " + why : ""));

    const fromAgain = S.posts().length;
    const again = askedOk ? await S.cancel(A, false) : null;
    const againOk = !!again && again.needsConfirm === true && again.moved === false && S.moves.length === 0
      && S.posts().length === fromAgain && S.row(A).pendingMove === true;
    check(againOk, "s3shellused asked again without the confirm it asks again, posts nothing and moves nothing " + againOk);

    const fromMove = S.posts().length;
    const done = againOk ? await S.cancel(A, true) : null;
    const epoch2 = (await S.epoch()) === 2;
    const wrapped = againOk ? await until(() => { const b = world.wrapOf(S.rt, B.ri.inv), c = world.wrapOf(S.rt, C.ri.inv);
      return !!b && !!c && b.epoch === 2 && c.epoch === 2; }, 20000) : false;
    const sent = S.posts().slice(fromMove), keyHex = S.keyAt2();
    const wrapB = wrapsOf(sent).find((w) => w.id === B.ri.inv), wrapC = wrapsOf(sent).find((w) => w.id === C.ri.inv);
    const openB = wrapB ? openSpec(B.secret, S.rt, S.teamId, B.ri.inv, wrapB.wrap) : null;
    const openC = wrapC ? openSpec(C.secret, S.rt, S.teamId, C.ri.inv, wrapC.wrap) : null;
    const moveOk = !!done && done.error === null && done.needsConfirm === false && done.moved === true && S.moves.length === 1 && epoch2
      && S.row(A).state === "withdrawn" && !S.secretOf(A) && S.row(A).pendingMove === false
      && !(done.invites || []).some((r) => r.id === A.made.id) && !!S.secretOf(B) && !!S.secretOf(C);
    check(moveOk, "s3shellused the confirm moves the team once, and the invitation has no secret and no pending mark afterwards " + moveOk
      + (done ? " (moved " + done.moved + ", moves " + S.moves.length + ", epoch 2 " + epoch2 + ", pending " + (S.row(A) && S.row(A).pendingMove) + ")" : ""));
    const nextOk = wrapped && wrapsOf(sent).every((w) => w.id !== A.ri.inv) && dropsOf(sent).indexOf(A.ri.inv) < 0
      && world.wrapOf(S.rt, A.ri.inv) == null && !!openB && !!openC && openB.epoch === 2 && openC.epoch === 2
      && !!keyHex && openB.key === keyHex && openC.key === keyHex;
    check(nextOk, "s3shellused the next sync's signed call seals the new key to the two left and carries no wrap for the cancelled one " + nextOk
      + " (wrapped " + wrapped + ", wraps " + wrapsOf(sent).length + ")");
    /* Every other team write keeps the file it wrote (keepWritten), so a later press that finds the share's team file gone
       puts back the one at the new epoch and never the one before the move. */
    const kept = K.keptTeam(S.teamsFile, S.teamId), held = await heldTeam(S.mirror, { key: S.keyAt });
    const keptOk = moveOk && !!kept && !!kept.file && kept.file.id === S.teamId && kept.file.epoch === 2
      && !!held.team && held.team.epoch === 2;
    check(keptOk, "s3shellused teams.json's kept copy of the team file is at the new epoch after the move " + keptOk
      + " (kept epoch " + (kept && kept.file ? kept.file.epoch : "none") + ", share's epoch " + (held.team ? held.team.epoch : "none") + ")");

    const spentC = await S.spend(C);
    SHELL_VAULT.isEncryptionAvailable = () => false;
    const fromC1 = S.posts().length;
    const noKey = spentC ? await S.cancel(C, true) : null;
    SHELL_VAULT.isEncryptionAvailable = () => true;
    const noKeyOk = !!noKey && typeof noKey.error === "string" && /cannot keep a team key/.test(noKey.error)
      && S.posts().length === fromC1 && !!world.store(S.rt).get("inv:" + C.ri.inv)
      && S.row(C).state === "live" && S.row(C).pendingMove === false;
    check(noKeyOk, "s3shellused with no keyring, a drop-and-move cancel posts nothing to the relay and changes nothing " + noKeyOk);

    const spentB = await S.spend(B);
    S.hooks.teamFacts = () => { throw new Error("the thread went away"); };
    const throwB = spentB ? await S.cancel(B, true) : null;
    const throwOk = !!throwB && typeof throwB.error === "string" && /the thread went away/.test(throwB.error)
      && S.moves.length === 1 && (await S.epoch()) === 2 && S.row(B).pendingMove === true;
    const doneB = throwOk ? await S.cancel(B, true) : null;
    const secondOk = !!doneB && doneB.error === null && doneB.moved === true && S.moves.length === 2
      && (await S.epoch()) === 3 && S.row(B).state === "withdrawn" && S.row(B).pendingMove === false;

    const knownC = await S.sync(() => { const r = S.relayRow(C); return !!r && r.relayState === "used"; });
    S.hooks.teamFacts = () => { throw new Error("the thread went away"); };
    const throwC = knownC ? await S.cancel(C, true) : null;
    const throwOkC = !!throwC && typeof throwC.error === "string" && /the thread went away/.test(throwC.error)
      && S.moves.length === 2 && (await S.epoch()) === 3 && S.row(C).pendingMove === true;
    const doneC = throwOkC ? await S.cancel(C, true) : null;
    const secondOkC = !!doneC && doneC.error === null && doneC.moved === true && S.moves.length === 3
      && (await S.epoch()) === 4 && S.row(C).state === "withdrawn" && S.row(C).pendingMove === false;
    check(throwOk && secondOk && throwOkC && secondOkC, "s3shellused a move made to throw leaves the row with pendingMove, and a second press completes it " + (throwOk && secondOk && throwOkC && secondOkC));
  } catch (e) {
    check(false, "s3shellused threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally { S.shell.done(); }
};

/* A move that lands and then throws (the thread's reply never comes back after the share has moved) never undoes the cancel:
   the invitation stays gone and its secret forgotten, and the next sync seals the new key to the invitation left and to the
   cancelled one never. A teams.json put back from before the cancel would hold it live again, under a team now at the next epoch. */
LEGS.s3shellthrow = async () => {
  const world = await relayWorld(), lab = labDir("relay-s3shellthrow");
  const S = await shellLead(world, lab, { invitations: ["Ada Quay", "Mira Lantern"], throwAfterMove: true });
  const [A, B] = S.inv;
  let why = "";
  try {
    const settled = await until(() => S.registered() && S.heard(), 20000);
    const used = settled && await S.spend(A);
    const known = used && await S.sync(() => { const r = S.relayRow(A); return !!r && r.relayState === "used"; });
    if (!known) why = "the invitation was not used and heard";
    const from = S.posts().length;
    const r = known ? await S.cancel(A, true) : null;
    const landed = S.moves.length === 1 && (await S.epoch()) === 2;
    const thrown = !!r && typeof r.error === "string" && /reply did not come back/.test(r.error);
    const stays = !!S.row(A) && S.row(A).state === "withdrawn" && !S.secretOf(A) && !!S.secretOf(B) && !!S.keyAt2();
    check(thrown && landed && stays, "s3shellthrow a move that lands and then throws leaves the invitation gone and its secret forgotten " + (thrown && landed && stays)
      + " (error " + JSON.stringify(r && r.error) + ", moves " + S.moves.length + ", epoch 2 " + landed + ", state " + (S.row(A) && S.row(A).state)
      + ", secret kept " + !!S.secretOf(A) + ")" + (why ? ": " + why : ""));
    const wrapped = thrown ? await S.sync(() => { const w = world.wrapOf(S.rt, B.ri.inv); return !!w && w.epoch === 2; }) : false;
    const sent = S.posts().slice(from);
    const wrapB = wrapsOf(sent).find((w) => w.id === B.ri.inv);
    const openB = wrapB ? openSpec(B.secret, S.rt, S.teamId, B.ri.inv, wrapB.wrap) : null;
    const nextOk = wrapped && wrapsOf(sent).every((w) => w.id !== A.ri.inv) && dropsOf(sent).indexOf(A.ri.inv) >= 0
      && world.wrapOf(S.rt, A.ri.inv) == null && !!openB && openB.epoch === 2 && openB.key === S.keyAt2();
    check(nextOk, "s3shellthrow the next sync seals the new key to the invitation left and to the cancelled one never " + nextOk
      + " (wrapped " + wrapped + ", cancelled one's wrap held " + (world.wrapOf(S.rt, A.ri.inv) ? "yes" : "no")
      + ", wraps for it sent " + wrapsOf(sent).filter((w) => w.id === A.ri.inv).length + ")");
  } catch (e) {
    check(false, "s3shellthrow threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally { S.shell.done(); }
};

/* ---- THE INVITATION'S TWO COPIES (Maxim, 2026-10-20 10:53: "Why as text? I will want to test all kind of invitations/connections") ---
   A relay team's row copies the https link by default and the etiuda-join: text as the second choice; a folder team's one copy
   is the text, since no link exists for it. The words are the copywriter's, final (her last-screens file of 2026-10-20, section 6). */
const COPY_WORDS = {
  linkEn: "Copy link", linkPl: "Kopiuj odnośnik",
  textEn: "Copy as text", textPl: "Kopiuj jako tekst",
  noteEn: "The invitation is on the clipboard as text, to be pasted in Etiuda.", notePl: "Zaproszenie jest w schowku jako tekst, do wklejenia w Etiudzie.",
};

/* THROUGH THE SHELL'S OWN HANDLERS, as Electron drives them with no window. What the clipboard is given is read back by the
   desk's own inviteRead (the pinned engine's, which has read the https form since engine main 0e5633c): the link and the text of
   a relay invitation are the same invitation, and the default is the link; a folder team's copy is the text, whichever is asked. */
LEGS.s3copies = async () => {
  const I = Engine.inviteRules(), posix = process.platform !== "win32";
  const read = (t) => I.inviteRead(String(t), posix);
  /* The parts of a read that make an invitation what it is, for comparing two reads. */
  const same = (r) => !r ? null : JSON.stringify({ team: r.team, folder: r.folder, relay: r.relay || null, secret: r.secret,
    lead: { keyId: r.lead.keyId, public: r.lead.public, name: r.lead.name, box: r.lead.box || "" } });
  const world = await relayWorld(), lab = labDir("relay-s3copies");
  /* One shell at a time: a loaded shell reads the signing key's path from the process environment at each call. */
  const S = await shellLead(world, lab, { invitations: ["Ada Quay"] });
  const [A] = S.inv;
  let why = "";
  try {
    const settled = await until(() => S.registered() && S.heard(), 20000);
    if (!settled) why = "the shell's first sync did not register the invitation";
    const clip = S.shell.clipboard;
    const link = await S.shell.ask("studio:invite-copy", S.dir, A.made.id);
    const text = await S.shell.ask("studio:invite-copy", S.dir, A.made.id, "text");
    const odd = await S.shell.ask("studio:invite-copy", S.dir, A.made.id, { form: "text" });
    const seen = clip.length === 3 && !link.error && !text.error && !odd.error && link.copied === A.made.id && text.copied === A.made.id;
    const readLink = read(clip[0]), readText = read(clip[1]);
    const asked = (r) => !!r && !!r.relay && r.relay.rt === S.rt && r.relay.url === Relay.RELAY_URL && r.relay.token === A.ri.token
      && r.relay.inv === A.ri.inv && r.secret === A.secret && r.team === S.teamId && r.lead.public === S.lead.public
      && r.lead.keyId === S.lead.keyId && r.lead.name === "Ada Quay";
    const forms = seen && /^https:\/\/etiuda\.dev\/join#[A-Za-z0-9_-]+$/.test(clip[0]) && /^etiuda-join:[A-Za-z0-9_-]+$/.test(clip[1])
      && clip[0].split("#")[1] === clip[1].slice("etiuda-join:".length);
    const one = forms && asked(readLink) && asked(readText) && same(readLink) === same(readText);
    /* A second choice is only the one word "text"; anything else the page might send is the default. */
    const oddOk = seen && clip[2] === clip[0];
    const said = !!link && link.as === "link" && !!text && text.as === "text";
    check(one && oddOk && said, "s3copies a relay invitation's default copy is the https link and the second choice the etiuda-join: text, both read by the"
      + " desk's own reader as the same invitation (team, relay id, invitation id, token, secret, lead) " + (one && oddOk && said)
      + " (copies " + clip.length + ", forms " + forms + ", link read " + asked(readLink) + ", text read " + asked(readText)
      + ", the same " + (same(readLink) === same(readText)) + ", other value is the default " + oddOk + ", replies say " + JSON.stringify([link.as, text.as]) + ", errors " + JSON.stringify([link.error, text.error, odd.error]) + ")"
      + (why ? ": " + why : ""));

    /* Made, the invitation goes to the clipboard in the default form too, and the page's note for a relay team says it is the link. */
    const made = await S.shell.ask("studio:invite-make", S.dir, "Mira Lantern", "Piotr Quay");
    const book = K.inviteBookOf(S.teamsFile, S.vault)[made.invited] || {};
    const relayRow = K.relayInvitesOf(S.teamsFile, S.vault, S.teamId).find((r) => r.id === made.invited) || {};
    const readMade = clip.length === 4 ? read(clip[3]) : null;
    const madeOk = !made.error && /^https:\/\/etiuda\.dev\/join#/.test(clip[3] || "") && !!readMade && !!readMade.relay
      && readMade.relay.inv === relayRow.inv && readMade.relay.token === relayRow.token && readMade.secret === book.secret && !!book.secret
      && readMade.lead.name === "Mira Lantern";
    check(madeOk, "s3copies a relay invitation made in the shell is put on the clipboard as the https link, and its desk reads the same invitation "
      + madeOk + (clip[3] ? "" : " (nothing was copied)"));
    if (relayRow.inv) await until(() => !!world.store(S.rt).get("inv:" + relayRow.inv), 20000);
  } catch (e) {
    check(false, "s3copies threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally { S.shell.done(); }

  /* A folder team can no longer make invitations. */
  const F = await shellLead(world, labDir("relay-s3copies-folder"), { folder: true });
  try {
    const fc = F.shell.clipboard;
    const fmade = await F.shell.ask("studio:invite-make", F.dir, "Mira Lantern", "Piotr Quay");
    const refused = !!fmade && /nobody can be invited/.test(String(fmade.error || "")) && fc.length === 0;
    check(refused, "s3copies a folder team refuses to make an invitation and puts nothing on the clipboard: "
      + JSON.stringify({ refused, clips: fc.length, error: fmade && fmade.error }));
  } catch (e) {
    check(false, "s3copies threw (folder): " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally { F.shell.done(); }
};

/* THE PAGE'S HALF. A relay team's row shows Copy link and Copy as text, the first sending the invitation's id alone and the
   second the id and the one word "text". The note after each says which was copied, in English and in Polish, the words
   the copywriter's, byte for byte. */
LEGS.s3copyui = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const Studio = await import("../src/studio.mjs");
  const lab = labDir("relay-s3copyui");
  const born = await Studio.newProject(lab, "Harbour Lamps", ["en"]);
  const dir = born && born.dir ? born.dir : born;
  const open = JSON.parse(JSON.stringify(await Studio.openProject(dir)));
  const ENT = { "&#39;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&amp;": "&" };
  const text = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m]).replace(/\s+/g, " ").trim();
  const inviteId = "0123456789abcdef";
  const screenOf = () => ({ error: null, folder: dir, id: "harbour-lamps", mark: null, signing: "studio-harbour", file: "ours",
    reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, requests: [], keyOpens: true,
    inviteName: "Mira Lantern", invites: [
      { id: inviteId, name: "Mira Lantern", person: "Piotr Quay", made: "2026-10-13T08:00:00.000Z", expires: "2026-10-20T08:00:00.000Z",
        code: "", relay: true, registered: true, used: null, deskName: "" }],
    team: { id: "t-0123456789abcdef", epoch: 1, relay: true, sealed: true, lists: true, exportsSealed: true, roster: [], recovery: false, leadPrint: "abcd" } });
  const paintOne = async (lang) => {
    const calls = [];
    const api = {
      desks: async () => JSON.parse(JSON.stringify(screenOf())),
      inviteCopy: async (...a) => {
        calls.push(a);
        return JSON.parse(JSON.stringify(Object.assign(screenOf(), { copied: a[1], as: a[2] !== "text" ? "link" : "text" })));
      },
    };
    const home = loadPage({ api, uiLang: lang });
    Object.assign(home.page.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
    await home.page.desksLoad();
    return { home, calls, Pg: home.page, main: () => home.node("#main").innerHTML };
  };
  const W = COPY_WORDS;
  const LINK_NOTE_EN = "The link is on the clipboard. Send it through your organisation's own mail or chat.";
  const LINK_NOTE_PL = "Odnośnik jest w schowku; można go wysłać pocztą lub czatem organizacji.";
  const el = { getAttribute: () => inviteId };
  const btn = (html, act) => { const m = html.match(new RegExp('<button[^>]*data-act="' + act + '"[^>]*>(.*?)</button>')); return m ? text(m[1]) : null; };
  const relayWay = async (lang, labels, linkNote, textNote, bare) => {
    const p = await paintOne(lang);
    const html = p.main();
    const row = btn(html, "invite-copy") === labels[0] && btn(html, "invite-copy-text") === labels[1]
      && html.indexOf('data-act="invite-copy" data-id="' + inviteId + '"') < html.indexOf('data-act="invite-copy-text" data-id="' + inviteId + '"')
      && !new RegExp(">\\s*" + bare + "\\s*<").test(html);
    await p.Pg.ACTS["invite-copy"](el);
    const first = p.calls.length === 1 && p.calls[0].length === 2 && p.calls[0][0] === dir && p.calls[0][1] === inviteId;
    const t1 = text(p.main());
    const linkSaid = t1.indexOf(linkNote) >= 0 && t1.indexOf(textNote) < 0;
    await p.Pg.ACTS["invite-copy-text"](el);
    const second = p.calls.length === 2 && p.calls[1].length === 3 && p.calls[1][1] === inviteId && p.calls[1][2] === "text";
    const t2 = text(p.main());
    const textSaid = t2.indexOf(textNote) >= 0 && t2.indexOf(linkNote) < 0;
    return { ok: row && first && linkSaid && second && textSaid, row, first, linkSaid, second, textSaid };
  };
  try {
    const en = await relayWay("en", [W.linkEn, W.textEn], LINK_NOTE_EN, W.noteEn, "Copy");
    const pl = await relayWay("pl", [W.linkPl, W.textPl], LINK_NOTE_PL, W.notePl, "Kopiuj");
    const ok = en.ok && pl.ok;
    check(ok, "s3copyui a relay row shows Copy link and Copy as text, each note says which was copied, in English"
      + " and in Polish " + ok + (ok ? "" : ": " + JSON.stringify({ en, pl })));
  } catch (e) {
    check(false, "s3copyui threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  }
};

/* BOARD 933, CONDITION 1. The cancel is marked in the book as soon as the relay's decision is known, before the catch-up that
   comes before the move, so the watch cannot let in, during that catch-up, a desk that asks through the invitation being
   cancelled. A used invitation, its desk's request waiting at the relay (the shell's reads held until then, so only the
   catch-up can land it), automatic joining on; the lead presses Cancel with the confirm, and the first look at the team after
   the catch-up is a pass of the watch. The request is not admitted, the roster after the move does not name that desk, the
   new key is wrapped for no one the request names, and the invitation left is sealed the new key as ever. */
LEGS.s3first = async () => {
  const world = await relayWorld(), lab = labDir("relay-s3first");
  const S = await shellLead(world, lab, { invitations: ["Ada Quay", "Mira Lantern"], verbs: ["watchAdmit"] });
  const [A, B] = S.inv;
  const I = Engine.inviteRules();
  const Y = deskKeys(), held = new Map();
  const mirrorHas = () => read(S.mirror, "desks/" + Y.keyId + "/join.json") !== null;
  let why = "", hold = false, atWatch = null, desk = null;
  /* The shell's reads of the relay are held, all but the states it asks (since 934 (4) a GET of the relay's own /states, where
     the lab's stand-in once answered a POST), so the book can hear the invitation asked while the request waits. */
  S.t.answer = async (method, url) => (hold && method === "GET" && !/\/states$/.test(String(url)) ? { status: 503, header: () => null, bytes: Buffer.alloc(0) } : null);
  try {
    const settled = await until(() => S.registered() && S.heard(), 20000);
    if (!settled) why = "the shell's first sync did not register and hear the invitations";
    const copied = settled && await until(() => world.entries(S.rt).some(([k, v]) => k.startsWith("blob:") && v.place === "invite:" + A.ri.inv), 20000);
    if (settled && !copied) why = "the invitation's copy did not reach the relay";
    /* The desk of invitation A asks through it, over the relay; the shell's reads of the relay are held meanwhile. */
    hold = true;
    desk = deskOf(world, lab, S, "desk-first", Y, held, { invite: () => ({ inv: A.ri.inv, token: A.ri.token, seal: A.ri.seal }) });
    const ask = joinRequest(S.teamId, Y, { id: I.inviteIdOf(A.secret), secret: A.secret });
    put(desk.mirror, "desks/" + Y.keyId + "/join.json", JSON.stringify(ask, null, 1) + "\n");
    desk.ch.start(); await settle(desk.ch);
    const at = world.store(S.rt).get("inv:" + A.ri.inv);
    const waiting = !!at && at.spent === true && at.uploaded === true;
    if (copied && !waiting) why = "the desk's request did not reach the relay";
    const known = waiting && await S.sync(() => { const r = S.relayRow(A); return !!r && r.relayState === "asked"; });
    if (waiting && !known) why = "the shell did not hear the invitation used";
    hold = false;
    const staged = known && !mirrorHas();
    if (known && !staged) why = "the request was in the mirror before the press";
    /* The first look at the team after the catch-up: a pass of the watch over the mirror, as a focus or a file event runs one. */
    S.hooks.teamFacts = async () => { atWatch = mirrorHas(); };
    const from = S.posts().length;
    const done = staged ? await S.cancel(A, true) : null;
    S.hooks.teamFacts = null;
    const epoch2 = (await S.epoch()) === 2;
    const wrapped = !!done && await until(() => { const w = world.wrapOf(S.rt, B.ri.inv); return !!w && w.epoch === 2; }, 20000);
    await until(() => false, 300);
    const heldNow = await heldTeam(S.mirror, { key: S.keyAt });
    const roster = heldNow.team && Array.isArray(heldNow.team.roster) ? heldNow.team.roster : [];
    const named = roster.some((e) => e && e.desk && (e.desk.id === Y.keyId || e.desk.key === Y.pub || e.desk.box === Y.box.pub));
    const opens = roster.some((e) => e && e.wrap && Engine.hpkeRules().unwrapTeamKey(Y.box.priv, e.wrap, S.teamId, 2, Y.keyId));
    const sent = S.posts().slice(from);
    const wrapB = wrapsOf(sent).find((w) => w.id === B.ri.inv);
    const openB = wrapB ? openSpec(B.secret, S.rt, S.teamId, B.ri.inv, wrapB.wrap) : null;
    const ok = !!done && done.error === null && done.moved === true && S.moves.length === 1 && epoch2 && wrapped
      && S.admitted.indexOf(Y.keyId) < 0 && !named && !opens && !world.store(S.rt).get("dev:" + Y.keyId)
      && S.row(A).state === "withdrawn" && !S.secretOf(A) && S.row(A).pendingMove === false && world.wrapOf(S.rt, A.ri.inv) == null
      && !!openB && openB.epoch === 2 && openB.key === S.keyAt2() && !!S.secretOf(B);
    check(ok, "s3first a used invitation's request reaching the share during the catch-up before the move is not admitted, the roster after the move"
      + " does not name that desk and the new key is wrapped for no one it names " + ok
      + (done ? " (moved " + done.moved + ", admitted " + S.admitted.length + ", named " + named + ", opens " + opens + ", enrolled "
        + !!world.store(S.rt).get("dev:" + Y.keyId) + ", state " + (S.row(A) && S.row(A).state) + ", request in the mirror at the watch "
        + atWatch + ", error " + JSON.stringify(done.error) + ")" : "")
      + (why ? ": " + why : ""));
  } catch (e) {
    check(false, "s3first threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally { hold = false; try { if (desk) await desk.ch.stop(); } catch { /* the desk was not started */ } S.shell.done(); }
};

/* ---- BOARD 922, THE LEAD'S ANSWER, THROUGH THE SHELL ---------------------------------------------------------------------
   The handlers are shell/main.js's, driven as Electron drives them with no window; the thread's refuseDeskJoin and watchAdmit
   are src/studio.mjs's, run in this process; the relay is the lab's. The desk's side of the answer is tests/relay-e2e.mjs's
   (re10 to re13); here is only that the shell asks for it, once and for the right requests, and tells the lead when it fails. */

/* A desk's request, signed by a desk key made here and put into the lead's mirror as the channel lands one. It proves
   invitation `i` ({secret}); with none it names no invitation, and with `forged` it names `i` under a proof that is not
   the secret's. Answers the desk's id. */
function askFor(S, i, forged) {
  const J = Engine.joinRules(), I = Engine.inviteRules();
  const Y = Object.assign(keyPair(true), { box: boxPair() });
  const commit = J.joinCommit(S.teamId, Y.pub, Y.box.pub, hex(32));
  const req = { format: 1, kind: J.JOIN_KIND, team: S.teamId, desk: { id: Y.keyId, key: Y.pub, box: Y.box.pub, name: "Desk " + hex(2) },
    date: new Date().toISOString(), commit };
  if (i) req.invite = { id: I.inviteIdOf(i.secret), proof: forged ? hex(32) : I.memberProof(i.secret, commit) };
  req.sig = { alg: "Ed25519", keyId: Y.keyId };
  req.sig.value = crypto.sign(null, J.joinSignedBytes(req), Y.privateKey).toString("hex");
  put(S.mirror, "desks/" + Y.keyId + "/join.json", JSON.stringify(req, null, 1) + "\n");
  return Y.keyId;
}
const answerPlaces = (world, S) => world.entries(S.rt).filter(([k, v]) => k.startsWith("blob:") && /^answer:/.test(String(v.place || ""))).map(([, v]) => v.place);

/* Pressing Refuse on a request that proves a relay invitation writes "refused" at the relay and withdraws the invitation, and
   its drop waits out the hold; once the hold is over the shell's own sync sends it. With the relay not answering, the refusal
   stands, the lead is told in the one placeholder sentence, and nothing else is done or undone. A request that names no
   invitation is refused as before. */
LEGS.s922r = async () => {
  const world = await relayWorld(), lab = labDir("relay-s922r");
  const S = await shellLead(world, lab, { invitations: ["Ada Quay", "Mira Lantern", "Nera Quay", "Cora Quay"], verbs: ["refuseDeskJoin"] });
  const [A, B, N, C] = S.inv;
  const blob = (i) => answerPlaces(world, S).indexOf("answer:" + i.ri.inv) >= 0;
  const refuse = (desk) => S.shell.ask("studio:desk-refuse", S.dir, desk);
  const refusedAt = (desk) => {
    let doc = null;
    try { doc = JSON.parse(read(S.mirror, Engine.joinRules().JOINS_NAME)); } catch { doc = null; }
    return !!doc && Array.isArray(doc.open) && doc.open.some((e) => e && e.desk === desk && e.refused === true);
  };
  let why = "";
  try {
    const settled = await until(() => S.registered() && S.heard(), 20000);
    if (!settled) why = "the shell's first sync did not register and hear the invitations";
    /* a request that proves invitation A, refused */
    const deskA = askFor(S, A);
    const a = settled ? await refuse(deskA) : null;
    await S.sync(() => true);
    const rowA = S.relayRow(A);
    const heldOk = !!a && a.error === null && a.answerSaid === undefined && blob(A) && refusedAt(deskA)
      && S.row(A).state === "withdrawn" && !S.secretOf(A) && !!rowA && rowA.gone === true && rowA.dropped === false
      && dropsOf(S.posts()).indexOf(A.ri.inv) < 0 && !!world.store(S.rt).get("inv:" + A.ri.inv)
      && !!S.secretOf(B) && !!S.secretOf(N) && !blob(B) && !blob(N);
    check(heldOk, "s922refuse Refuse on a request that proves a relay invitation writes the answer at the relay " + (!!a && blob(A))
      + ", withdraws the invitation, and holds its drop: the relay still has it " + !!world.store(S.rt).get("inv:" + A.ri.inv)
      + ", no drop posted " + (dropsOf(S.posts()).indexOf(A.ri.inv) < 0) + (a ? " (error " + JSON.stringify(a.error) + ", said " + JSON.stringify(a.answerSaid) + ")" : "")
      + (why ? ": " + why : ""));

    /* the hold over, the shell's own sync sends the drop */
    K.markRelayInvite(S.teamsFile, S.teamId, A.made.id, { dropAfter: 1 });
    const dropped = heldOk && await S.sync(() => { const r = S.relayRow(A); return !!r && r.dropped === true; });
    const dropOk = dropped && dropsOf(S.posts()).indexOf(A.ri.inv) >= 0 && !world.store(S.rt).get("inv:" + A.ri.inv);
    check(dropOk, "s922hold once the hold is over the shell's sync drops the withdrawn invitation by the lead's signed call " + dropOk);

    /* the relay not answering (E1 of the test architect's verdict on 922's Studio half): the refusal stands, the invitation is
       withdrawn in the book at once, the answer is kept owed on its row, and the lead is told; nothing moves the team, the
       relay having last said the invitation was unused */
    const deskB = askFor(S, B);
    const fromDown = answerPlaces(world, S).length;
    S.t.down = true;
    const b = await refuse(deskB);
    S.t.down = false;
    const rowB = S.relayRow(B);
    const downOk = !!b && b.error === null && typeof Relay.ANSWER_UNSENT === "string" && b.answerSaid === Relay.ANSWER_UNSENT && b.needsConfirm === undefined
      && refusedAt(deskB) && answerPlaces(world, S).length === fromDown
      && S.row(B).state === "withdrawn" && !S.secretOf(B) && !!rowB && rowB.gone === true && rowB.dropped === false
      && !!rowB.owed && rowB.owed.desk === deskB && rowB.dropAfter === null && rowB.pendingMove === false && S.moves.length === 0;
    check(downOk, "s922down with the relay not answering the refusal stands " + refusedAt(deskB) + ", the lead is told the sentence "
      + (!!b && b.answerSaid === Relay.ANSWER_UNSENT) + ", and the invitation is withdrawn " + (!!S.row(B) && S.row(B).state === "withdrawn")
      + " with the answer owed " + (!!rowB && !!rowB.owed) + " and not dropped " + (!!rowB && rowB.dropped === false)
      + (b ? " (said " + JSON.stringify(b.answerSaid) + ")" : ""));

    /* the relay reached again: the shell's sync writes the owed answer, and the hold on the drop counts from then */
    const reachedAt = Date.now();
    const written = downOk && await S.sync(() => blob(B));
    const rowB2 = S.relayRow(B);
    const owedOk = !!written && !!rowB2 && rowB2.owed === null && Number.isFinite(rowB2.dropAfter) && rowB2.dropAfter >= reachedAt + Relay.ANSWER_HOLD_MS
      && rowB2.dropped === false && !!world.store(S.rt).get("inv:" + B.ri.inv) && dropsOf(S.posts()).indexOf(B.ri.inv) < 0;
    check(owedOk, "s922owed once the relay is reached the shell's sync writes the owed answer " + !!written + ", clears it " + (!!rowB2 && rowB2.owed === null)
      + " and holds the drop a week from then " + (!!rowB2 && Number.isFinite(rowB2.dropAfter) && rowB2.dropAfter >= reachedAt + Relay.ANSWER_HOLD_MS));

    /* a retry whose first write reached the relay but the reply was lost: refused replay-counter, clears owed and holds */
    const deskC = askFor(S, C);
    const origRequest = S.t.request;
    let failedOnce = false;
    S.t.request = async (method, url, headers, body) => {
      const res = await origRequest(method, url, headers, body);
      if (!failedOnce && method === "PUT" && String(url).includes("/b/" + C.ri.inv)) {
        failedOnce = true;
        throw new Error("lost reply");
      }
      return res;
    };
    const c = await refuse(deskC);
    S.t.request = origRequest;
    const rowCPre = S.relayRow(C);
    const lostOk = !!c && c.error === null && !!rowCPre && rowCPre.owed !== null && blob(C);
    await S.sync(() => true);
    /* A ceiling, not a delay: the wait returns as soon as the answer clears. 4 s went red twice under load on 2026-11-01. */
    await until(() => { const r = S.relayRow(C); return !!r && r.owed === null; }, 30000);
    const rowC = S.relayRow(C);
    const owedClear = !!rowC && rowC.owed === null;
    const dropAfterOk = !!rowC && Number.isFinite(rowC.dropAfter) && rowC.dropAfter >= reachedAt + Relay.ANSWER_HOLD_MS;
    const notDropped = !!rowC && rowC.dropped === false;
    const replayOk = lostOk && owedClear && dropAfterOk && notDropped;
    check(replayOk, "s922replay a retry refused replay-counter clears the owed answer and starts the hold: lostOk " + lostOk
      + ", owed cleared " + owedClear + ", dropAfter held " + dropAfterOk + ", not dropped " + notDropped);

    /* a request that names no invitation, and one that names a live invitation under a proof that fails */
    const deskN = askFor(S, null), deskF = askFor(S, N, true);
    const fromPlain = answerPlaces(world, S).length;
    const n = await refuse(deskN), f = await refuse(deskF);
    const plainOk = !!n && n.error === null && n.answerSaid === undefined && !!f && f.error === null && f.answerSaid === undefined
      && refusedAt(deskN) && refusedAt(deskF) && answerPlaces(world, S).length === fromPlain
      && S.row(N).state === "live" && !!S.secretOf(N) && S.relayRow(N).gone === false;
    check(plainOk, "s922plain a request that names no invitation, or names one under a proof that fails, is refused as before: no answer, the invitation"
      + " untouched " + plainOk);
  } catch (e) {
    check(false, "s922r threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally { await S.shell.done(); }
};

/* The watch lets in a desk whose request proves a live invitation: "joined" is written at the relay, the invitation is
   spent and is not dropped, and the roster's desk is then enrolled by the same sync. */
LEGS.s922a = async () => {
  const world = await relayWorld(), lab = labDir("relay-s922a");
  const S = await shellLead(world, lab, { invitations: ["Ada Quay", "Mira Lantern"], verbs: ["watchAdmit"] });
  const [A, B] = S.inv;
  const blob = (i) => answerPlaces(world, S).indexOf("answer:" + i.ri.inv) >= 0;
  let why = "";
  try {
    const settled = await until(() => S.registered() && S.heard(), 20000);
    if (!settled) why = "the shell's first sync did not register and hear the invitations";
    const deskA = askFor(S, A);
    const told = settled && await S.sync(() => blob(A));
    const enrolled = told && await until(() => !!world.store(S.rt).get("dev:" + deskA), 20000);
    const held = await heldTeam(S.mirror, { key: S.keyAt });
    const onRoster = !!held.team && (held.team.roster || []).some((e) => e && e.desk && e.desk.id === deskA);
    const rowA = S.relayRow(A);
    const ok = told && enrolled && onRoster && S.row(A).state === "spent" && !!rowA && rowA.gone === false && rowA.dropped === false
      && dropsOf(S.posts()).indexOf(A.ri.inv) < 0 && !blob(B) && S.row(B).state === "live";
    check(ok, "s922admit the watch lets in a desk that proves a relay invitation and writes joined at the relay " + !!told + ", the desk is on the roster "
      + onRoster + " and enrolled " + !!enrolled + ", the invitation is spent and not dropped " + (!!rowA && !rowA.gone && !rowA.dropped)
      + (why ? ": " + why : ""));
  } catch (e) {
    check(false, "s922a threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally { await S.shell.done(); }
};

/* ---- A4, THE RELAY TEAM'S STANDING DOOR, STUDIO'S HALF (board 980) ------------------------------------------------------
   The relay's door and the channel's knock are the pin's (relay-unit a4a to a4m, relay-channel a4c); here is what Studio does with
   them over the lab's relay: the door posted at the licence reference while the lead is signed in and closed otherwise, never for a
   Studio that never signed in; the lead's own box handed to its channel, so a request at the door opens; a known person's certified
   desk let in with nobody acting, answered and enrolled; a stranger's, or a removed person's, not let in and its request dropped. */
const A4_REF = "5a".repeat(16), A4_OTHER_REF = "6b".repeat(16);
const a4Person = (word) => sha(Buffer.from("pseudonym\n" + word));
const a4Code = (word) => Array.from(crypto.createHash("sha256").update("code\n" + word).digest(), (b) => "0123456789ABCDEFGHJKMNPQRSTVWXYZ"[b & 31]).slice(0, 16).join("");
/* A seat certificate as the licence service signs one, under a delegation of the lab's root that may sign "licence", which the
   lab's relay trusts (its roots) and Studio trusts here by STUDIO_VENDOR_KEY, as a development tree does. */
function a4Cert(world, deskPub, word, ref) {
  const now = world.R.clock.now, issued = now - 3600000;
  const c = { kind: "etiuda-seat-certificate", format: 1, licence: ref || A4_REF, desk: deskPub, person: a4Person(word), code: a4Code(word), issued,
    until: issued + 20 * 24 * 3600000, via: grantKit.delegationFor(now, { fields: { may: ["licence"] } }) };
  c.sig = { alg: "Ed25519", keyId: grantKit.DELEGATE.id, value: "" };
  c.sig.value = crypto.sign(null, world.core.certBytes(c), grantKit.DELEGATE.privateKey).toString("hex");
  return c;
}
/* A desk whose person signed in, knocking at the team's door with its certificate: its request carries the seat and, once the relay
   has named the request, that id, both under its own signature, rewritten when the relay names it (onDoor), as the desk's shell does. */
function a4Desk(world, lab, s, name, word, ref) {
  const who = deskKeys(), J = Engine.joinRules(), held = new Map(), answers = [];
  const seat = { format: 2, desk: who.keyId, certificate: a4Cert(world, who.pub, word, ref) };
  const box = (() => { let x = null; try { x = openLeadBox(readKeyFile(s.keyAt), unlockKey(readKeyFile(s.keyAt), labSecret(s.keyAt))); } catch { x = null; } return x ? x.public : ""; })();
  const door = { door: seat.certificate, box, inv: "" };
  const commit = J.joinCommit(s.teamId, who.pub, who.box.pub, hex(32));
  const write = () => {
    const req = { format: 1, kind: J.JOIN_KIND, team: s.teamId, desk: { id: who.keyId, key: who.pub, box: who.box.pub, name: name },
      date: new Date().toISOString(), commit, seat };
    if (door.inv) req.door = door.inv;
    req.sig = { alg: "Ed25519", keyId: who.keyId };
    req.sig.value = crypto.sign(null, J.joinSignedBytes(req), who.privateKey).toString("hex");
    put(path.join(lab, name), "desks/" + who.keyId + "/join.json", JSON.stringify(req, null, 1) + "\n");
  };
  write();
  const d = deskOf(world, lab, s, name, who, held, { invite: () => door, onDoor: (id) => { door.inv = id; write(); }, onAnswer: (a) => answers.push(a) });
  return Object.assign(d, { who, door, answers, held });
}
async function a4Lead(name, o) {
  const world = await relayWorld(), lab = labDir("relay-" + name);
  const A = deskKeys();
  const refs = { now: o && o.refs ? o.refs : [A4_REF] };
  const s = await studioLead(world, lab, { roster: [A], wraps: true, runner: { doorRefs: () => refs.now } });
  return { world, lab, s, A, refs };
}
const a4Watch = (s, o) => import("../src/studio.mjs").then((Studio) => Studio.watchAdmit(s.mirror, s.keyAt, labSecret(s.keyAt),
  Object.assign({ auto: true, teamKeys: K.teamKeysOf(s.teamsFile, s.vault), seatRef: A4_REF }, o || {})));
const a4Door = (world, s) => { const v = world.store(s.rt) ? world.store(s.rt).get("door") : undefined; return v && Array.isArray(v.refs) ? v.refs.join(",") : null; };

/* The door: posted at the licence reference by the lead's signed call while it is signed in, closed by an empty list once it is not,
   nothing posted again while nothing changed, and nothing at all for a Studio that never signed in. */
LEGS.rsA4door = async () => {
  let L = null, U = null;
  try {
    L = await a4Lead("rsA4door");
    const { world, s, refs } = L;
    await s.runner.sync(); await s.runner.idle();
    const opened = a4Door(world, s);
    const posts = () => s.t.log.filter((l) => /^POST door$/.test(l)).length;
    const once = posts();
    await s.runner.sync(); await s.runner.idle();
    const still = posts();
    refs.now = [];
    await s.runner.sync(); await s.runner.idle();
    const closed = a4Door(world, s), afterClose = posts();
    await s.runner.sync(); await s.runner.idle();
    const quiet = posts();
    U = await a4Lead("rsA4door-unsigned", { refs: [] });
    await U.s.runner.sync(); await U.s.runner.idle();
    const made = !!U.world.store(U.s.rt) && !!U.world.store(U.s.rt).get("dev:" + U.A.keyId);
    const unsignedPosts = U.s.t.log.filter((l) => /door/.test(l)).length;
    const ok = opened === A4_REF && once === 1 && still === 1 && closed === "" && afterClose === 2 && quiet === 2 && made && unsignedPosts === 0
      && U.world.store(U.s.rt).get("door") === undefined;
    check(ok, "rsA4door the standing door is posted at the licence reference while the lead is signed in (" + opened + "), once (" + once + ", " + still
      + "), closed by an empty list once it is not (" + JSON.stringify(closed) + ", " + afterClose + " posts, then " + quiet + "), and a Studio that never"
      + " signed in makes its team and posts no door (" + unsignedPosts + " door calls, team made " + made + ")");
  } catch (e) {
    check(false, "rsA4door threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally {
    if (L) await L.s.runner.stop();
    if (U) await U.s.runner.stop();
  }
};

/* THE DOORS AT THE LICENCE SERVICE (board 980, the door-finding): after a sync the runner sets this key's open doors at the service,
   each the team's id, its relay team id, the relay's address, the key's canonical id and the lead's box; nothing again while nothing
   changed; the empty set once the door closes; asked again after a refusal; and nothing at all from a Studio that never signed in. */
LEGS.rsDoorSvc = async () => {
  let L = null, U = null;
  try {
    const world = await relayWorld(), lab = labDir("relay-rsDoorSvc"), A = deskKeys();
    const refs = { now: [A4_REF] }, sets = [], reply = { ok: true };
    const s = await studioLead(world, lab, { roster: [A], wraps: true, runner: { doorRefs: () => refs.now,
      serviceDoors: async (doors) => { sets.push(JSON.parse(JSON.stringify(doors))); return reply.ok ? { ok: true, doors: doors.length } : { ok: false, reason: "unreached" }; } } });
    L = { s };
    const box = (() => { let x = null; try { x = openLeadBox(readKeyFile(s.keyAt), unlockKey(readKeyFile(s.keyAt), labSecret(s.keyAt))); } catch { x = null; } return x ? x.public : ""; })();
    const keyId = "studio-" + crypto.createHash("sha256").update(Buffer.from(s.lead.public, "hex")).digest("hex").slice(0, 16);
    const sync = async () => { await s.runner.sync(); await s.runner.idle(); };
    await sync();
    const first = sets.slice();
    await sync();
    const quiet = sets.length;
    reply.ok = false;
    refs.now = [];
    await sync();
    const refusedTries = sets.length;
    reply.ok = true;
    await sync();
    const cleared = sets[sets.length - 1], afterClear = sets.length;
    await sync();
    const quietAgain = sets.length;
    const usets = [];
    const uworld = await relayWorld(), ulab = labDir("relay-rsDoorSvc-unsigned"), UA = deskKeys();
    const us = await studioLead(uworld, ulab, { roster: [UA], wraps: true, runner: { doorRefs: () => [], serviceDoors: async (d) => { usets.push(d); return { ok: true }; } } });
    U = { s: us };
    await us.runner.sync(); await us.runner.idle();
    const door = first[0] && first[0][0];
    const whole = first.length === 1 && first[0].length === 1 && !!door && JSON.stringify(Object.keys(door).sort()) === '["box","keyId","rt","team","url"]'
      && door.team === s.teamId && door.rt === s.rt && door.url === Relay.RELAY_URL && door.keyId === keyId && s.lead.keyId === keyId && door.box === box && /^[0-9a-f]{64}$/.test(box);
    const ok = whole && quiet === 1 && refusedTries === 2 && Array.isArray(cleared) && cleared.length === 0 && afterClear === 3 && quietAgain === 3 && usets.length === 0;
    check(ok, "rsDoorSvc the runner sets this key's open door at the licence service after a sync, whole (" + JSON.stringify(door || null).slice(0, 80) + "), once ("
      + quiet + "); once the door closes the empty set, asked again after a refusal (" + refusedTries + " then " + afterClear + ", " + JSON.stringify(cleared) + "), then quiet ("
      + quietAgain + "); a Studio that never signed in sets nothing (" + usets.length + ")");
  } catch (e) {
    check(false, "rsDoorSvc threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally {
    if (L) await L.s.runner.stop();
    if (U) await U.s.runner.stop();
  }
};

/* End to end over the lab's relay: a certified desk of a person the lead admitted knocks, its request reaches Studio's mirror (the
   lead's box handed to the channel), the watch lets it in with nobody acting, the answer joined reaches it, its key is enrolled and it
   reads the team's key; a stranger's certified desk is not let in and its request is dropped at the relay; a removed person's new desk
   is not let in until the lead admits that person again. */
LEGS.rsA4 = async () => {
  const wasVendor = process.env.STUDIO_VENDOR_KEY;
  process.env.STUDIO_VENDOR_KEY = GRANT_ROOT_PUB;
  let L = null;
  const desks = [];
  try {
    L = await a4Lead("rsA4");
    const { world, lab, s } = L;
    await s.runner.sync(); await s.runner.idle();
    const ada = { [s.teamId]: { [a4Person("ada")]: { code: a4Code("ada"), at: Date.now() } } };
    const ask = async (d) => { desks.push(d); d.ch.start(); await settle(d.ch); await s.runner.sync(); await s.runner.idle(); };
    const inMirror = (d) => !!read(s.mirror, "desks/" + d.who.keyId + "/join.json");
    /* a desk of a person the lead admitted */
    const D = a4Desk(world, lab, s, "a4-ada", "ada");
    await ask(D);
    const reached = inMirror(D) && /^[0-9a-f]{32}$/.test(D.door.inv);
    const r = await a4Watch(s, { people: ada });
    const told = await Relay.answerDoors(s.runner, { team: s.teamId, doors: r.doors });
    const answerAt = world.entries(s.rt).some(([k, v]) => k.startsWith("blob:") && v.place === "answer:" + D.door.inv);
    await settle(D.ch);
    await s.runner.sync(); await s.runner.idle();
    const enrolled = !!world.store(s.rt).get("dev:" + D.who.keyId);
    await until(async () => { await settle(D.ch); return D.answers.indexOf("joined") >= 0 && D.held.has(1); }, 20000);
    const held = await heldTeam(s.mirror, { key: s.keyAt });
    const onRoster = !!held.team && held.team.roster.some((e) => e && e.desk && e.desk.id === D.who.keyId && e.door === "auto");
    const doorOk = reached && r.admitted.length === 1 && r.admitted[0] === D.who.keyId && r.doors.length === 1 && r.doors[0].door === D.door.inv
      && told.length === 0 && answerAt && enrolled && onRoster && D.answers.indexOf("joined") >= 0 && D.held.get(1) && Buffer.compare(D.held.get(1), s.teamKey) === 0;
    check(doorOk, "rsA4admit a known person's certified desk knocks with no invitation, its request reaches Studio's mirror " + reached
      + ", the watch lets it in with nobody acting " + JSON.stringify(r.admitted) + ", the answer joined reaches it " + JSON.stringify(D.answers)
      + ", its key is enrolled " + enrolled + " and it reads the team's key " + !!D.held.get(1) + " (answer at the relay " + answerAt + ", told " + JSON.stringify(told) + ", said " + JSON.stringify(D.said.slice(-4)) + ")");
    /* a stranger's certified desk */
    const E = a4Desk(world, lab, s, "a4-eve", "eve");
    await ask(E);
    const eReached = inMirror(E) && /^[0-9a-f]{32}$/.test(E.door.inv);
    const before = !!world.store(s.rt).get("inv:" + E.door.inv);
    const re = await a4Watch(s, { people: ada });
    const dropped = await s.runner.dropDoors(s.teamId, (re.dropDoors || []).map((x) => x.door));
    const strangerOk = eReached && before && re.admitted.length === 0 && (re.dropDoors || []).length === 1 && re.dropDoors[0].desk === E.who.keyId
      && !!dropped && dropped.ok === true && !world.store(s.rt).get("inv:" + E.door.inv) && !world.store(s.rt).get("dev:" + E.who.keyId);
    check(strangerOk, "rsA4stranger a stranger's certified desk at the door reaches the mirror " + eReached + " and is not let in "
      + JSON.stringify(re.admitted) + "; its request is dropped at the relay by the lead's signed call " + (!!dropped && dropped.ok) + ", the relay"
      + " holding it no more " + !world.store(s.rt).get("inv:" + E.door.inv));
    /* a removed person's new desk, then the person admitted again */
    const F = a4Desk(world, lab, s, "a4-ada-new", "ada");
    await ask(F);
    const removed = { [s.teamId]: { [a4Person("ada")]: { code: a4Code("ada"), at: 1, removed: Date.now() } } };
    const rf = await a4Watch(s, { people: removed, seatBooks: {} });
    const rAgain = await a4Watch(s, { people: ada });
    const removedOk = inMirror(F) && rf.admitted.length === 0 && (rf.dropDoors || []).some((x) => x.desk === F.who.keyId)
      && rAgain.admitted.length === 1 && rAgain.admitted[0] === F.who.keyId;
    check(removedOk, "rsA4removed a removed person's new certified desk is not let in " + JSON.stringify(rf.admitted) + " and is handed back to be"
      + " dropped, whatever that person's desk on the roster holds, until the lead admits the person again " + JSON.stringify(rAgain.admitted));
  } catch (e) {
    check(false, "rsA4 threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally {
    if (wasVendor === undefined) delete process.env.STUDIO_VENDOR_KEY; else process.env.STUDIO_VENDOR_KEY = wasVendor;
    for (const d of desks) { try { await d.ch.stop(); } catch { /* not started */ } }
    if (L) await L.s.runner.stop();
  }
};

/* Through the shell as Electron drives it with no window: a Studio not signed in makes its team and posts no door; signed in (its
   licence-service.json carrying the reference, as keepWho writes it), its own sync opens the door at that reference, its own watch
   lets in a certified desk of a person admitted to the team (team-people.json) and writes the answer joined, and drops a stranger's
   request at the relay. */
LEGS.rsA4shell = async () => {
  const wasVendor = process.env.STUDIO_VENDOR_KEY;
  process.env.STUDIO_VENDOR_KEY = GRANT_ROOT_PUB;
  const world = await relayWorld(), lab = labDir("relay-rsA4shell");
  const A = deskKeys();
  const S = await shellLead(world, lab, { roster: [A], verbs: ["watchAdmit"] });
  const desks = [];
  const focusUntil = async (done) => { for (let i = 0; i < 8; i++) { await S.shell.fire("focus"); if (await until(done, 5000)) return true; } return false; };
  try {
    const made = await until(() => !!world.store(S.rt) && !!world.store(S.rt).get("dev:" + A.keyId), 20000);
    await S.shell.fire("focus"); await until(() => false, 300);
    const unsignedDoor = S.t.log.filter((l) => /door/.test(l)).length === 0 && world.store(S.rt).get("door") === undefined;
    fs.writeFileSync(path.join(S.ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", licenceRef: A4_REF }));
    fs.writeFileSync(path.join(S.ud, "team-people.json"), JSON.stringify({ [S.teamId]: { [a4Person("ada")]: { code: a4Code("ada"), at: Date.now() } } }));
    const opened = await focusUntil(() => a4Door(world, S) === A4_REF);
    const D = a4Desk(world, S.lab, S, "a4s-ada", "ada"), E = a4Desk(world, S.lab, S, "a4s-eve", "eve");
    for (const d of [D, E]) { desks.push(d); d.ch.start(); await settle(d.ch); }
    const answered = await focusUntil(() => world.entries(S.rt).some(([k, v]) => k.startsWith("blob:") && v.place === "answer:" + D.door.inv));
    const enrolled = await focusUntil(() => !!world.store(S.rt).get("dev:" + D.who.keyId));
    const droppedE = await focusUntil(() => /^[0-9a-f]{32}$/.test(E.door.inv) && !world.store(S.rt).get("inv:" + E.door.inv));
    const ok = made && unsignedDoor && opened && answered && enrolled && droppedE && S.admitted.indexOf(D.who.keyId) >= 0 && S.admitted.indexOf(E.who.keyId) < 0;
    check(ok, "rsA4shell through the shell: not signed in, the team is made and no door is posted " + unsignedDoor + "; signed in, the door opens at the"
      + " reference " + opened + ", the watch lets in an admitted person's certified desk and writes joined at its door id " + answered + ", the sync"
      + " enrols it " + enrolled + ", and a stranger's request is dropped at the relay " + droppedE);
  } catch (e) {
    check(false, "rsA4shell threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally {
    if (wasVendor === undefined) delete process.env.STUDIO_VENDOR_KEY; else process.env.STUDIO_VENDOR_KEY = wasVendor;
    for (const d of desks) { try { await d.ch.stop(); } catch { /* not started */ } }
    await S.shell.done();
  }
};

/* The page tells the lead what the shell hands back, in English and in Polish, on the press of Refuse. */
LEGS.s922said = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const id = "k-0011223344556677";
  const paint = async (lang) => {
    const home = loadPage({ api: { deskRefuse: async () => ({ error: null, folder: "C:/quay", file: "ours", requests: [],
      answerSaid: Relay.ANSWER_UNSENT, team: { id: "t-quay", epoch: 1, relay: true, roster: [], sealed: true } }) }, uiLang: lang });
    const P = home.page;
    Object.assign(P.S, { open: { dir: "C:/quay", draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [],
      project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
      host: { tour: { offered: true } }, screen: "projects", home: "team", teamDir: "C:/quay", cover: null, err: null, dkNote: null, q: "",
      desks: { team: { id: "t-quay", epoch: 1, relay: true, roster: [], sealed: true }, folder: "C:/quay", file: "ours",
        requests: [{ id: id, name: "Desk Nine", key: "a".repeat(64), asked: "2026-10-20T08:00:00.000Z", state: "asks", kind: "desk",
          door: "invitation", invite: "valid", inviteId: "0123456789abcdef" }] } });
    await P.ACTS["desk-refuse"]({ getAttribute: (k) => (k === "data-id" ? id : null) });
    return home.node("#main").innerHTML;
  };
  const en = await paint("en"), pl = await paint("pl");
  const enOk = en.indexOf(Relay.ANSWER_UNSENT) >= 0, plOk = pl.indexOf(Relay.ANSWER_UNSENT_PL) >= 0 && pl.indexOf(Relay.ANSWER_UNSENT) < 0;
  check(enOk && plOk, "s922said Refuse, answered with the sentence the shell hands back, says it on the Desks screen in English " + enOk + " and in Polish " + plOk);
};

/* An owed invitation answer survives a counter-floor refusal: a second program raises the lead's floor,
   the answer is refused replay-counter with a floor, answerOwed is kept, Studio restarts, and the next
   sync writes it so the desk reads it. Red on today's main. */
LEGS.s922floor = async () => {
  const world = await relayWorld(), lab = labDir("relay-s922floor");
  const S = await shellLead(world, lab, { invitations: ["Dora Quay"], verbs: ["refuseDeskJoin"] });
  const [D] = S.inv;
  const blob = () => answerPlaces(world, S).indexOf("answer:" + D.ri.inv) >= 0;
  const I = Engine.inviteRules();
  const whoD = deskKeys(), heldD = new Map();
  let deskAns = null;
  let why = "";
  let desk = null;
  try {
    const settled = await until(() => S.registered() && S.heard(), 20000);
    if (!settled) why = "the shell's first sync did not register and hear the invitations";

    /* The desk asks through invitation D */
    const teamDoc = JSON.parse(read(S.mirror, world.C.TEAM_NAME) || "{}");
    const leadBox = teamDoc.lead && teamDoc.lead.box ? teamDoc.lead.box : "";
    desk = deskOf(world, lab, S, "desk-dora", whoD, heldD, {
      invite: () => ({ inv: D.ri.inv, token: D.ri.token, seal: D.ri.seal, box: leadBox }),
      onAnswer: (a) => { deskAns = a; },
    });
    const ask = joinRequest(S.teamId, whoD, { id: I.inviteIdOf(D.secret), secret: D.secret });
    put(desk.mirror, "desks/" + whoD.keyId + "/join.json", JSON.stringify(ask, null, 1) + "\n");
    desk.ch.start();
    await settle(desk.ch);
    const askedHeard = settled && await S.sync(() => { const r = S.relayRow(D); return !!r && r.relayState === "asked"; });
    if (settled && !askedHeard) why = "the shell did not hear the invitation asked";

    /* The lead refuses the desk with the relay down, so the answer is kept owed */
    S.t.down = true;
    const ref = await S.shell.ask("studio:desk-refuse", S.dir, whoD.keyId);
    S.t.down = false;
    const rowOwed = S.relayRow(D);
    const downOk = !!ref && ref.error === null && ref.answerSaid === Relay.ANSWER_UNSENT
      && !!rowOwed && rowOwed.gone === true && rowOwed.dropped === false && !!rowOwed.owed && !blob();
    if (!downOk) why = "refuse while down did not keep answer owed";

    /* A second program raises the lead's floor on the relay as the answer is sent */
    const origRequest = S.t.request;
    let raised = false;
    S.t.request = async (method, url, headers, body) => {
      if (!raised && method === "PUT" && String(url).includes("/b/" + D.ri.inv)) {
        raised = true;
        const B = Engine.relayRules().blob;
        const curCounters = world.store(S.rt).get("counters") || {};
        const curFloor = curCounters["c\n" + S.lead.keyId + "\n1"] || Math.floor(Date.now());
        const targetFloor = curFloor + 10000000;
        world.store(S.rt).put("counters", B.raiseCounter(curCounters, S.lead.keyId, 1, targetFloor));
      }
      return origRequest(method, url, headers, body);
    };

    /* Studio syncs: writeOwed is refused replay-counter with a floor.
       Criterion: answerOwed MUST be kept on this counter-floor refusal! */
    const putAttempted = await S.sync(() => raised);
    S.t.request = origRequest;
    const rowAfterReplay = S.relayRow(D);
    /* Kept owed is the criterion. Whether the relay already holds the answer by now is not: a retry above the named floor
       may have written it within this sync, which is the outcome wanted, so it is printed, not asserted (the test
       architect's note of 2026-10-29 04:47; the whole run took that path where a run alone did not). */
    const heldAfterReplay = !!blob();
    const keptOwed = putAttempted && raised && !!rowAfterReplay && rowAfterReplay.owed !== null;
    if (!keptOwed) why = "counter-floor refusal did not keep answer owed (row owed is " + JSON.stringify(rowAfterReplay && rowAfterReplay.owed)
      + ", the relay holds the answer " + heldAfterReplay + ")";

    /* Studio restarts */
    await S.restart();

    /* Next sync writes the answer above the floor, and the desk reads it */
    const written = keptOwed && await S.sync(() => blob());
    /* Wait for the owed answer to be cleared, not only for the blob: where a retry above the floor already wrote it, the blob
       is there at once, and the row is cleared only by a later sync (the whole run took that path). */
    if (written) await S.sync(() => { const r = S.relayRow(D); return !!r && r.owed === null; });
    const rowAfterSync = S.relayRow(D);
    const clearedAndHeld = !!written && !!rowAfterSync && rowAfterSync.owed === null
      && Number.isFinite(rowAfterSync.dropAfter) && rowAfterSync.dropped === false;

    /* Desk reads the answer */
    if (desk) { desk.ch.kick(); await settle(desk.ch); }
    const deskRead = deskAns === "refused";

    const ok = downOk && raised && keptOwed && written && clearedAndHeld && deskRead;
    check(ok, "s922floor an owed answer survives counter-floor refusal: down " + downOk
      + ", floor raised " + raised + ", owed kept after replay-counter " + keptOwed + " (the relay already holding it " + heldAfterReplay + ")"
      + ", written after restart " + !!written + ", cleared " + (!!rowAfterSync && rowAfterSync.owed === null)
      + ", desk read refused " + deskRead + (why ? ": " + why : ""));
  } catch (e) {
    check(false, "s922floor threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally {
    if (desk) { try { await desk.ch.stop(); } catch { } }
    await S.shell.done();
  }
};

/* ---- board 926: a team first made on the Etiuda relay ----------------------------------------------------------------- */

/* A lead's Studio at rest: its signing key, a project with one card, and what a leg reads the result with. The shell is
   loaded over it as the other legs load it (loadStudioShell), with the two thread verbs the handler asks for run for real. */
async function leadAtRest(lab, name, noKey, o) {
  const x = o || {};
  const S = await import("../src/studio.mjs");
  const ud = path.join(lab, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const keyAt = path.join(ud, "signing-key.json");
  const made = noKey ? null : (x.passphraseFile ? await makeKeyFile({ passphrase: PASS }) : await labLeadKey());
  if (made) {
    fs.writeFileSync(keyAt, JSON.stringify(made, null, 1) + "\n");
    if (x.passphraseFile) namePassphraseFile(keyAt);
  }
  /* The grant the relay comes with (board 935, G3), unless a leg is to be without one (`o.noGrant`) or wants it made otherwise. */
  const grant = made && !x.noGrant ? granted(keyAt, made.public, undefined, x.grantOpts) : null;
  const proj = (await S.newProject(path.join(lab, "projects"), name, [{ code: "en", name: "English" }])).dir;
  const shelf = (await S.addTag(proj, "shelf", { en: "Openers" })).tag.id;
  await S.addCard(proj, shelf, "Warm opening", "Good day, and welcome to Lantern Quay.");
  const projectJson = () => JSON.parse(fs.readFileSync(path.join(proj, "project.json"), "utf8"));
  return { S, ud, keyAt, made, grant, proj, teamsFile: K.teamsFile(ud), vault: shellVault(), projectJson,
    env: Object.assign({ STUDIO_PROJECTS: path.join(lab, "projects"), STUDIO_SIGNING_KEY: keyAt, STUDIO_RELAY_ROOT: GRANT_ROOT_PUB },
      x.passphraseFile ? { STUDIO_KEY_PASSPHRASE: PASS } : {}),
    thread: (verb, ...a) => (verb === "teamFacts" || verb === "startRelayTeam" || verb === "undoRelayTeam" ? S[verb](...a) : {}) };
}
/* The shell asks the relay for the team's space as soon as the team is kept, and the lab does not reach it: that sync has said
   its piece when the shell has printed it, and only then is the shell put down, so it leaves no runner behind. The line comes
   with the sync or not at all, so this wait is not what the part proves. The test architect's profile of 2026-11-10 found h2e
   spending about 63 s of 95 s in three idle stretches that run this ceiling out after the mirrors and the sequence are already
   written. Five seconds is the give-up: the line came inside two in every part that prints it, and a loaded machine gets room (the test architect's read); a
   part that proves the line waits in its own until. */
const shellSettled = (shell) => until(() => shell.said.some((l) => /relay of team|relay could not/.test(l)), 5000);
const teamRelayHandler = (shell) => typeof shell.handlers["studio:team-relay"] === "function";

/* The lead's choice of the relay, where a team is first made, is one handler in the shell. It mints the relay team id, keeps the
   team's key and the mirror through keepRelay with the built-in address, has the signed team file written into the mirror with the
   relay as its channel, and points the project's publish place at the mirror. Its reply holds no path, address or relay team id. */
LEGS.rs926a = async () => {
  const lab = labDir("relay-rs926a"), R = await leadAtRest(lab, "Lantern Quay");
  const shell = await loadStudioShell(R.ud, { env: R.env, thread: R.thread });
  const have = teamRelayHandler(shell);
  let reply = null;
  try {
    if (have) { reply = await shell.ask("studio:team-relay", R.proj); await shellSettled(shell); }
  } finally { shell.done(); }
  const rec = K.relayTeams(R.teamsFile)[0] || null, mirror = rec ? rec.folder : "";
  const kept = rec ? K.keptTeam(R.teamsFile, rec.team) : null;
  const keys = rec ? K.teamKeysOf(R.teamsFile, R.vault)[rec.team] : null;
  const read1 = rec && fs.existsSync(mirror) ? await heldTeam(mirror, { key: R.keyAt }) : { team: null };
  const t = read1.team, project = R.projectJson();
  const facts = rec ? await R.S.teamFacts(R.proj, { key: R.keyAt }) : null;
  const wire = JSON.stringify(reply), seps = (p) => [p, p.split("\\").join("/"), p.split("/").join("\\")];
  const leaks = rec ? seps(mirror).concat(seps(R.ud), [Relay.RELAY_URL, "etiuda.dev", rec.rt]).filter((x) => wire.indexOf(x) >= 0) : ["no team"];
  const ok = {
    handler: have,
    reply: !!reply && reply.error === null && reply.relay === true && reply.created === true && !!reply.team && /^t-[0-9a-f]{16}$/.test(reply.team.id),
    kept: !!rec && !!reply && !!reply.team && rec.team === reply.team.id && rec.url === Relay.RELAY_URL && /^[0-9a-f]{32}$/.test(rec.rt)
      && mirror === K.relayMirror(R.teamsFile, rec.rt) && !!kept && !!kept.relay && kept.relay.rt === rec.rt && kept.folder === mirror
      && kept.sealed === true && kept.epochs.indexOf(1) >= 0,
    key: !!keys && !!keys[1] && keys[1].length === 32,
    file: !!t && !!rec && t.id === rec.team && t.lead.public === R.made.public && t.sealed === true && t.epoch === 1
      && Engine.relayRules().channel.canon(t.channel) === Engine.relayRules().channel.canon({ kind: "relay", rt: rec.rt, url: Relay.RELAY_URL })
      && !!t.ring && t.ring.keys.length === 0 && t.catalogs[0] === project.id && t.recovery !== undefined,
    place: !!rec && project.folder === mirror && project.sealedTeam === (rec && rec.team),
    desks: !!facts && facts.file === "ours" && !!facts.team && facts.team.sealed === true && facts.folder === mirror,
    quiet: leaks.length === 0,
    synced: !!rec && shell.said.some((l) => l.indexOf("relay of team " + rec.team) >= 0),
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rs926a the lead's choice of the relay is one handler: " + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ")
    + (rec ? "; the relay team kept at <user data>/relay/<its id>, channel " + JSON.stringify(t && t.channel && t.channel.kind) : "; no relay team kept")
    + (leaks.length ? "; the reply leaks " + JSON.stringify(leaks) : "") + (reply && reply.error ? "; error " + JSON.stringify(reply.error) : ""));
};

/* The first-time rule and the undo. A project that has a team is not given another by a second press; a throw part way leaves
   nothing behind: not the team, not its key, not the mirror, and the project's place is as it was. */
LEGS.rs926b = async () => {
  const lab = labDir("relay-rs926b"), R = await leadAtRest(lab, "Lantern Quay");
  let first = null, second = null;
  const shell = await loadStudioShell(R.ud, { env: R.env, thread: R.thread });
  const have = teamRelayHandler(shell);
  try {
    if (have) { first = await shell.ask("studio:team-relay", R.proj); await shellSettled(shell); second = await shell.ask("studio:team-relay", R.proj); }
  } finally { shell.done(); }
  const book = () => { try { return Object.keys(JSON.parse(fs.readFileSync(R.teamsFile, "utf8")).teams); } catch { return []; } };
  const twice = { first: !!first && first.error === null, refused: !!second && !!second.error && !!second.said
    && second.said.frame === "This catalog has a team already, so no other was started.",
    one: K.relayTeams(R.teamsFile).length === 1 && book().length === 1 };
  /* A key that will not open: the thread throws before it writes, and the shell forgets the team it had kept. */
  const labW = labDir("relay-rs926b-key"), W = await leadAtRest(labW, "Quay Lamps", false, { passphraseFile: true });
  let wrong = null;
  const shellW = await loadStudioShell(W.ud, { env: Object.assign({}, W.env, { STUDIO_KEY_PASSPHRASE: "not-the-passphrase" }), thread: W.thread });
  try { if (teamRelayHandler(shellW)) wrong = await shellW.ask("studio:team-relay", W.proj); } finally { shellW.done(); }
  const none = { refused: !!wrong && !!wrong.error, book: (() => { try { return Object.keys(JSON.parse(fs.readFileSync(W.teamsFile, "utf8")).teams).length === 0; } catch { return true; } })(),
    relays: K.relayTeams(W.teamsFile).length === 0, mirror: !fs.existsSync(path.join(W.ud, "relay")), place: W.projectJson().folder === null };
  /* A write the signing refuses after the mirror is made: a floor above the team's epoch, kept beside the key, refuses the team
     file, and the verb takes back the mirror it made. */
  const labU = labDir("relay-rs926b-undo"), U = await leadAtRest(labU, "Quay Lanes");
  const teamId = "t-" + hex(8), rt = Relay.relayId(), mirror = K.relayMirror(U.teamsFile, rt);
  K.keepTeamKey(U.teamsFile, U.vault, teamId, 1, crypto.randomBytes(32));
  fs.writeFileSync(path.join(path.dirname(U.keyAt), "team-revs.json"), JSON.stringify({ format: 1, kind: "etiuda-studio-team-revs",
    teams: { [teamId]: { [U.made.public]: { epoch: 2, rev: 5 } } } }, null, 1) + "\n");
  let threw = null;
  try {
    await U.S.startRelayTeam(U.proj, { key: U.keyAt, passphrase: labSecret(U.keyAt), teamId, rt, url: Relay.RELAY_URL, mirror, teamKeys: K.teamKeysOf(U.teamsFile, U.vault) });
  } catch (e) { threw = e; }
  const undone = { threw: !!threw && threw.older === true, mirror: !fs.existsSync(mirror), place: U.projectJson().folder === null };
  check(have && twice.first && twice.refused && twice.one && Object.keys(none).every((k) => none[k]) && Object.keys(undone).every((k) => undone[k]),
    "rs926b a project that has a team is not given another, and a throw part way leaves nothing behind: handler " + have + ", first press "
    + twice.first + ", second refused in its frame " + twice.refused + ", one team kept " + twice.one + "; a key that will not open: " + JSON.stringify(none)
    + "; a write the signing refuses after the mirror is made: " + JSON.stringify(undone));
};

/* The made team is a working team and not only a file: a desk of it, through the lab relay as the other legs use it, reads the team
   file and an edition the project published into its own place. The relay's space is made by the runner, as for any kept relay team. */
LEGS.rs926c = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs926c"), R = await leadAtRest(lab, "Lantern Quay");
  const shell = await loadStudioShell(R.ud, { env: R.env, thread: R.thread });
  let reply = null;
  try {
    if (teamRelayHandler(shell)) { reply = await shell.ask("studio:team-relay", R.proj); await shellSettled(shell); }
  } finally { shell.done(); }
  const rec = K.relayTeams(R.teamsFile)[0];
  if (!rec) { check(false, "rs926c no relay team was made, so there is nothing for a desk to read" + (reply && reply.error ? ": " + reply.error : "")); return; }
  const teamKey = K.teamKeysOf(R.teamsFile, R.vault)[rec.team][1], mirror = rec.folder;
  /* The lead admits a desk as an admission does: the roster names it, and its entry carries the team key wrapped to its box. */
  const X = deskKeys();
  const held = (await heldTeam(mirror, { key: R.keyAt })).team;
  const roster = withDesk(held, { id: X.keyId, key: X.pub, box: X.box.pub });
  roster.roster.find((e) => e.desk.id === X.keyId).wrap = Engine.hpkeRules().wrapTeamKey(teamKey, X.box.pub, rec.team, 1, X.keyId);
  await writeTeam(mirror, roster, { key: R.keyAt, passphrase: labSecret(R.keyAt) });
  /* An edition from Studio's own publish, which names no folder: the project's own place is the mirror. */
  const pub = await R.S.publishProject(R.proj, { notes: "Edition one.", now: "2026-10-20T07:00:00.000Z", leadKey: R.keyAt,
    teamKeys: K.teamKeysOf(R.teamsFile, R.vault), key: R.keyAt, passphrase: labSecret(R.keyAt), ...LIC });
  const lines = [], t = world.transport("studio");
  const runner = trackRunner({ roots: GRANT_ROOTS, teamsFile: R.teamsFile, vault: R.vault, keyFile: R.keyAt, secret: () => labSecret(R.keyAt), request: t.request,
    connect: t.connect, watch: false, pollMs: 1e9, say: (l) => lines.push(l) });
  const spaceBefore = !!world.store(rec.rt) && !!world.store(rec.rt).get("team");
  await runner.sync(); await runner.idle();
  const space = world.store(rec.rt) && world.store(rec.rt).get("team");
  const s = { rt: rec.rt, teamId: rec.team, lead: { keyId: R.made.keyId, public: R.made.public } };
  const desk = deskOf(world, lab, s, "desk", X, new Map([[1, teamKey]]));
  desk.ch.start(); await settle(desk.ch);
  const names = (fs.existsSync(mirror) ? fs.readdirSync(mirror) : []).filter((n) => /\.ec$/i.test(n));
  const T = Engine.teamRules(), text = read(desk.mirror, world.C.TEAM_NAME);
  const got = T.v2TeamRead(text), sig = got.team ? await T.v2TeamSigState(got.team) : T.states.none;
  const seal = Engine.sealRules();
  let edition = null;
  try { edition = JSON.parse(seal.openSealed(teamKey, JSON.parse(read(desk.mirror, names[0] || "none.ec")))); } catch { edition = null; }
  const ok = {
    published: !!pub && !pub.error && names.length > 0 && names.every((n) => read(desk.mirror, n) === read(mirror, n)),
    space: !spaceBefore && !!space && space.lead.pub === R.made.public && K.relayTeams(R.teamsFile)[0].created === true,
    teamFile: !!got.team && sig === T.states.valid && got.team.id === rec.team && got.team.lead.public === R.made.public
      && !!got.team.channel && got.team.channel.kind === "relay" && got.team.channel.rt === rec.rt && text === read(mirror, world.C.TEAM_NAME)
      && got.team.roster.some((e) => e && e.desk && e.desk.id === X.keyId),
    opens: !!edition && edition.id === R.projectJson().id && JSON.stringify(edition).indexOf("welcome to Lantern Quay") >= 0,
    nowhereElse: world.foreign.length === 0,
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rs926c a desk of the team made by the handler reads its team file and a published edition through the lab relay: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + "; editions " + JSON.stringify(names) + ", calls elsewhere " + world.foreign.length
    + (lines.length ? " (" + lines.slice(0, 2).join(" | ") + ")" : ""));
  await desk.ch.stop(); await runner.stop();
};

/* Board 962 stage 6, U1: a relay team of two catalogs takes B off, then A. A desk of the team, through the lab relay, follows A only
   after B leaves: its team file lists A alone, B's file leaves its mirror, A's stays, and the head names A only; once A leaves too, the
   runner deletes the head it signed (it leads no edition) and the desk's mirror holds no head, no catalog file. */
LEGS.rs962s6g = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs962s6g"), R = await leadAtRest(lab, "Lantern Quay");
  const rt = Relay.relayId(), teamId = "t-" + crypto.randomBytes(8).toString("hex"), teamKey = crypto.randomBytes(32);
  K.keepTeamKey(R.teamsFile, R.vault, teamId, 1, teamKey);
  const mirror = K.keepRelay(R.teamsFile, teamId, rt, Relay.RELAY_URL);
  const keys = () => K.teamKeysOf(R.teamsFile, R.vault);
  const made = await R.S.startRelayTeam(R.proj, { key: R.keyAt, passphrase: labSecret(R.keyAt), teamId, rt, url: Relay.RELAY_URL, mirror, teamKeys: keys(), userData: R.ud });
  K.chooseSealed(R.teamsFile, teamId, true, mirror, made.written);
  const B = (await R.S.newProject(path.join(lab, "projects"), "Harbour Notes", [{ code: "en", name: "English" }])).dir;
  const shelfB = (await R.S.addTag(B, "shelf", { en: "Notes" })).tag.id;
  await R.S.addCard(B, shelfB, "Tide note", "The tide turns at the harbour wall.");
  const relay = { rt, url: Relay.RELAY_URL };
  const chose = await R.S.chooseTeam(B, { key: R.keyAt, passphrase: labSecret(R.keyAt), teamId, folder: mirror, work: mirror, relay, elsewhere: [], teamKeys: keys(), userData: R.ud });
  K.chooseSealed(R.teamsFile, teamId, true, mirror, chose.written);
  /* A desk admitted as an admission does it. */
  const X = deskKeys();
  const held = (await heldTeam(mirror, { key: R.keyAt })).team;
  const roster = withDesk(held, { id: X.keyId, key: X.pub, box: X.box.pub });
  roster.roster.find((e) => e.desk.id === X.keyId).wrap = Engine.hpkeRules().wrapTeamKey(teamKey, X.box.pub, teamId, 1, X.keyId);
  await writeTeam(mirror, roster, { key: R.keyAt, passphrase: labSecret(R.keyAt) });
  const signed = { leadKey: R.keyAt, key: R.keyAt, passphrase: labSecret(R.keyAt), userData: R.ud, ...LIC };
  await R.S.publishProject(R.proj, Object.assign({ notes: "A one.", now: "2026-11-09T07:00:00.000Z", teamKeys: keys() }, signed));
  await R.S.publishProject(B, Object.assign({ notes: "B one.", now: "2026-11-09T07:05:00.000Z", teamKeys: keys() }, signed));
  const idA = R.projectJson().id, idB = JSON.parse(fs.readFileSync(path.join(B, "project.json"), "utf8")).id;
  const lines = [], t = world.transport("studio");
  const runner = trackRunner({ roots: GRANT_ROOTS, teamsFile: R.teamsFile, vault: R.vault, keyFile: R.keyAt, secret: () => labSecret(R.keyAt), request: t.request,
    connect: t.connect, watch: false, pollMs: 1e9, say: (l) => lines.push(l) });
  const s = { rt, teamId, lead: { keyId: R.made.keyId, public: R.made.public } };
  const desk = deskOf(world, lab, s, "desk", X, new Map([[1, teamKey]]));
  const seal = Engine.sealRules();
  const idsAt = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter((n) => /\.ec$/i.test(n)).map((n) => {
    try { return JSON.parse(seal.openSealed(teamKey, JSON.parse(read(dir, n)))).id; } catch { return "?"; }
  }).sort();
  const headIds = (dir) => { try { return (JSON.parse(read(dir, Relay.HEAD_NAME)).editions || []).map((e) => e.catalog).sort(); } catch { return null; } };
  const listed = (dir) => { try { return JSON.parse(read(dir, world.C.TEAM_NAME)).catalogs.slice().sort(); } catch { return null; } };
  const round = async () => { await runner.sync(); await runner.idle(); await settle(desk.ch); };
  const leaveOpts = { key: R.keyAt, passphrase: labSecret(R.keyAt), teamId, folder: mirror, work: mirror, relay, root: path.join(lab, "projects"), userData: R.ud };
  const both = [idA, idB].sort();
  try {
    desk.ch.start();
    await round();
    const before = { listed: JSON.stringify(listed(desk.mirror)) === JSON.stringify(both), files: JSON.stringify(idsAt(desk.mirror)) === JSON.stringify(both),
      head: JSON.stringify(headIds(desk.mirror)) === JSON.stringify(both) };
    await R.S.leaveTeam(B, Object.assign({ teamKeys: keys() }, leaveOpts));
    await round();
    const afterB = { listed: JSON.stringify(listed(desk.mirror)) === JSON.stringify([idA]), files: JSON.stringify(idsAt(desk.mirror)) === JSON.stringify([idA]),
      head: JSON.stringify(headIds(desk.mirror)) === JSON.stringify([idA]) };
    await R.S.leaveTeam(R.proj, Object.assign({ teamKeys: keys() }, leaveOpts));
    await round();
    const afterA = { listed: JSON.stringify(listed(desk.mirror)) === "[]", files: idsAt(desk.mirror).length === 0,
      noHead: !fs.existsSync(path.join(mirror, Relay.HEAD_NAME)) && read(desk.mirror, Relay.HEAD_NAME) === null };
    const all = Object.assign({}, ...Object.entries({ before, afterB, afterA }).map(([k, v]) => Object.fromEntries(Object.entries(v).map(([q, b]) => [k + "." + q, b]))));
    check(Object.values(all).every((v) => v === true) && world.foreign.length === 0,
      "rs962s6g a desk on a relay team follows A only once B leaves (its team file, its mirror's files, the head), and once A leaves too the head"
      + " is gone from the relay and the desk: " + Object.keys(all).map((k) => k + " " + all[k]).join(", ") + "; desk holds " + JSON.stringify(idsAt(desk.mirror))
      + ", head " + JSON.stringify(headIds(desk.mirror)) + (lines.length ? " (" + lines.slice(0, 2).join(" | ") + ")" : ""));
  } finally { await desk.ch.stop(); await runner.stop(); }
};

/* A lead who opens a relay team's project on a second computer of their own (a fresh profile B with the lead's signing key,
   the project folder brought over or synced) gets the project back onto its relay team, its key and team file restored. */
LEGS.rs2comp = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs2comp");
  const R = await leadAtRest(path.join(lab, "a"), "Lantern Quay");
  const tA = world.transport("shellA");
  const shellA = await loadStudioShell(R.ud, { relay: tA, env: R.env, thread: R.thread });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { shellA.done(); }
  if (!recA) { check(false, "rs2comp profile A did not create the relay team"); return; }
  const keyA = K.teamKeysOf(R.teamsFile, R.vault)[recA.team][1];

  /* Profile B: a second computer with a fresh profile, the lead's signing key restored, teams.json knowing nothing yet. */
  const udB = path.join(lab, "b", "ud");
  fs.mkdirSync(udB, { recursive: true });
  const keyAtB = path.join(udB, "signing-key.json");
  fs.writeFileSync(keyAtB, JSON.stringify(R.made, null, 1) + "\n");
  granted(keyAtB, R.made.public);
  const teamsFileB = K.teamsFile(udB), vaultB = shellVault();
  const tB = world.transport("shellB");
  const threadB = (verb, ...a) => (verb === "teamFacts" || verb === "teamKeyBack" || verb === "openProject" ? R.S[verb](...a) : {});
  /* Profile B opens the shared project folder R.proj, so its projects root lists R.proj. */
  const envB = { STUDIO_PROJECTS: path.dirname(R.proj), STUDIO_SIGNING_KEY: keyAtB, STUDIO_RELAY_ROOT: GRANT_ROOT_PUB };
  const shellB = await loadStudioShell(udB, { relay: tB, env: envB, thread: threadB });
  try {
    await shellB.ask("studio:desks", R.proj);
    await shellSettled(shellB);
  } finally { shellB.done(); }

  const recB = K.relayTeams(teamsFileB)[0] || null;
  const mirrorB = recB ? recB.folder : "";
  const keptB = recB ? K.keptTeam(teamsFileB, recB.team) : null;
  const keysB = recB ? (K.teamKeysOf(teamsFileB, vaultB)[recB.team] || {})[1] : null;
  const readB = recB && fs.existsSync(mirrorB) ? await heldTeam(mirrorB, { key: keyAtB }) : { team: null };
  const projectAfter = R.projectJson();

  const ok = {
    registered: !!recB && recB.team === recA.team && recB.rt === recA.rt && mirrorB === K.relayMirror(teamsFileB, recB.rt),
    kept: !!keptB && keptB.sealed === true && keptB.folder === mirrorB,
    key: !!keysB && Buffer.from(keysB).equals(keyA),
    teamFile: !!readB.team && readB.team.id === recA.team,
    /* The shared project keeps the first computer's folder. The second computer's mirror stays in its own teams file (h2a). */
    place: projectAfter.folder === recA.folder && projectAfter.folder !== mirrorB && projectAfter.sealedTeam === recA.team && !!projectAfter.relay && projectAfter.relay.rt === recA.rt,
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rs2comp opening a relay project on a fresh profile restores the relay team, key and team file: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

/* Board 962 stage 5, T5: on the relay's first-team cover, a team this Studio leads is the third place. Chosen, the cover is that
   team's: no relay sentence and no trial (a team kept already has its licence, judged by the shell), the press goes to
   studio:team-choose and never makes a relay team, and nothing shown names the kept relay team's id or address. */
LEGS.rs962t5 = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const lab = labDir("relay-rs962t5");
  const S0 = await import("../src/studio.mjs");
  const made = await S0.newProject(path.join(lab, "projects"), "Tide Book", [{ code: "en", name: "English" }]);
  const base = await S0.openProject(made.dir), calls = [];
  const kept = { id: "t-00000000000000d4", connection: "relay", relay: { rt: "0123456789abcdef0123456789abcdef", url: Relay.RELAY_URL }, sealed: true, led: true,
    leadPrint: "87ad0879ac3e9ff6", catalogs: ["c-lantern"], projects: [{ id: "c-lantern", name: "Lantern Quay", dir: "C:/lib/lantern", rev: 4 }],
    project: { id: "c-lantern", name: "Lantern Quay", dir: "C:/lib/lantern", rev: 4 }, teammates: [{ id: "k-1", name: "Iga", admitted: true, version: "2.0.0" }], count: 1 };
  const api = { teamRelay: async (d) => { calls.push(["relay", d]); return { error: null }; },
    teamChoose: async (d, t) => { calls.push(["choose", d, t]); return { error: null, folder: "x", team: { id: t }, carried: true, relay: true }; },
    desks: async () => ({ folder: null, file: "none", signing: "studio-0123456789abcdef", requests: [], canKeep: true, team: null }) };
  const home = loadPage({ api, uiLang: "en" }), P = home.page, T = P.T;
  /* A provider offered, so the relay's cover in evaluation offers signing in (its trial). */
  Object.assign(P.S, { open: Object.assign({}, base, { project: Object.assign({}, base.project, { folder: null }) }), host: { tour: { offered: true }, signIn: ["microsoft"] },
    screen: "projects", home: "team", teamDir: base.dir, teamPickDir: base.dir, cover: "team", teamWant: "sealed", teamWhere: "relay", err: null, dkNote: null, q: "",
    teamLic: { licence: { status: "none" }, grant: null }, teams: [kept],
    desks: { folder: null, file: "none", signing: "studio-0123456789abcdef", requests: [], canKeep: true, team: null } });
  const relayFirst = String(P.teamCoverHtml());
  P.ACTS["team-where"]({ getAttribute: () => "team" });
  const chosen = String(P.teamCoverHtml());
  try { await P.ACTS["do-team-choose"](); } catch { /* a repaint the stand-in cannot finish; the calls are what is read */ }
  const f = {
    two: ["relay", "team"].every((v) => relayFirst.indexOf('data-act="team-where" data-v="' + v + '"') >= 0) && relayFirst.indexOf('data-v="folder"') < 0,
    chosen: chosen.indexOf('aria-checked="true" data-act="team-where" data-v="team"') >= 0 && chosen.indexOf("Lantern Quay") >= 0
      && chosen.indexOf(T("the Etiuda relay")) >= 0 && chosen.indexOf("data-trial") < 0
      && chosen.indexOf(T("Editions travel through the Etiuda relay sealed, so that only the team can read them.")) < 0,
    hidden: [kept.relay.rt, Relay.RELAY_URL, "etiuda.dev"].every((x) => chosen.indexOf(x) < 0),
    pressed: calls.length === 1 && calls[0][0] === "choose" && calls[0][1] === made.dir && calls[0][2] === kept.id,
  };
  check(Object.keys(f).every((k) => f[k]), "rs962t5 the relay's first-team cover offers a team this Studio leads as a second place (a third until 2026-11-20, when the shared folder went); chosen, it drops"
    + " the relay sentence and the trial, names no relay team id or address, and the press asks studio:team-choose, never a new relay team: "
    + JSON.stringify(f));
};

/* The page: where a team is first made the lead is asked, the relay is the default and a shared folder is the path as it was; an
   existing team's cover asks nothing; and nothing shown names the mirror's path, the address or the relay team id. */
LEGS.rs926d = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const lab = labDir("relay-rs926d"), ud = path.join(lab, "ud"), rt = Relay.relayId();
  const mirror = K.relayMirror(K.teamsFile(ud), rt), share = "C:/quay/share";
  const S0 = await import("../src/studio.mjs");
  const made = await S0.newProject(path.join(lab, "projects"), "Lantern Quay", [{ code: "en", name: "English" }]);
  const dir = made.dir, base = await S0.openProject(dir);
  const calls = [];
  const api = { teamRelay: async (d) => { calls.push(["relay", d]); return { error: null, relay: true, created: true, team: { id: "t-0123456789abcdef" } }; },
    teamSealed: async (d, sealed, fresh) => { calls.push(["folder", d, sealed, fresh]); return { error: null, folder: share, created: true, team: { id: "t-0123456789abcdef" } }; },
    desks: async () => ({ folder: mirror, file: "ours", signing: "studio-0123456789abcdef", requests: [], canKeep: true,
      team: { id: "t-0123456789abcdef", epoch: 1, relay: true, roster: [], sealed: true, exportsSealed: true, leadPrint: "87ad0879ac3e9ff6" } }),
    pickFolder: async () => ({ folder: null }) };
  const project = (folder) => Object.assign({}, base, { project: Object.assign({}, base.project, { folder }), fileName: "lanterns.ec" });
  const state = (P, extra) => Object.assign(P.S, { open: project(null), host: { tour: { offered: true } }, screen: "projects", home: "team", teamDir: dir, cover: "team",
    teamWant: "sealed", teamWhere: "relay", err: null, dkNote: null, q: "",
    desks: { folder: share, file: "none", signing: "studio-0123456789abcdef", requests: [], canKeep: true, team: null } }, extra || {});
  const seen = {};
  for (const lang of ["en", "pl"]) {
    const home = loadPage({ api, uiLang: lang }), P = home.page, T = P.T;
    const labels = [T("the Etiuda relay")];
    state(P);
    const first = String(P.teamCoverHtml());
    const folderChosen = (P.ACTS["team-where"]({ getAttribute: () => "folder" }), String(P.teamCoverHtml()));
    state(P, { teamWant: "fresh", desks: { folder: share, file: "theirs", lead: "87ad0879ac3e9ff6", signing: "studio-0123456789abcdef", requests: [], canKeep: true, team: null } });
    const fresh = String(P.teamCoverHtml());
    state(P, { desks: { folder: share, file: "ours", signing: "studio-0123456789abcdef", requests: [], canKeep: true,
      team: { id: "t-0123456789abcdef", epoch: 1, roster: [], sealed: false } } });
    const existing = String(P.teamCoverHtml());
    state(P, { desks: { folder: null, file: "none", signing: "studio-0123456789abcdef", requests: [], canKeep: true, team: null }, cover: null });
    P.paintMain();
    const noFolder = home.node("#main").innerHTML;
    seen[lang] = {
      labels, first: labels.every((x) => first.indexOf(x) >= 0) && first.indexOf(T("a shared folder")) < 0 && first.indexOf(T("Where the team meets")) >= 0
        && /data-v="relay"[^>]*>/.test(first) && first.indexOf('aria-checked="true" data-act="team-where" data-v="relay"') >= 0,
      folder: folderChosen.indexOf('aria-checked="true" data-act="team-where" data-v="relay"') >= 0 && folderChosen.indexOf('data-v="folder"') < 0 && folderChosen.indexOf(T("Seal what this folder is given")) < 0,
      fresh: fresh.indexOf(labels[0]) >= 0 && fresh.indexOf(T("Start a new team on the Etiuda relay")) >= 0,
      existing: existing.indexOf("team-where") < 0 && existing.indexOf(labels[0]) < 0,
      noFolder: /data-act="team-seal"/.test(noFolder) && /data-act="settings-folder"/.test(noFolder),
    };
  }
  /* The press: the relay, and a forced "folder" answer (no click can give it since 2026-11-20) goes the relay's way too. */
  const run = async (where) => {
    const home = loadPage({ api, uiLang: "en" }), P = home.page;
    state(P, { teamWhere: where });
    P.S.open = project(null);
    calls.length = 0;
    try { await P.ACTS["do-team-seal"](); } catch { /* a repaint the stand-in cannot finish; the calls are what is read */ }
    return { calls: calls.slice(), folder: P.S.open.project.folder };
  };
  const byDefault = await run("relay"), byFolder = await run("folder");
  const routes = { relay: byDefault.calls.length === 1 && byDefault.calls[0][0] === "relay" && byDefault.calls[0][1] === dir,
    folder: byFolder.calls.length === 1 && byFolder.calls[0][0] === "relay" && byFolder.calls[0][1] === dir,
    placeKnown: byDefault.folder === mirror };
  /* What a relay team's screens show. */
  const shown = {};
  for (const lang of ["en", "pl"]) {
    const home = loadPage({ api, uiLang: lang }), P = home.page, name = P.T("the Etiuda relay");
    state(P, { cover: null, open: project(mirror), desks: await api.desks() });
    P.paintMain();
    const desksHtml = home.node("#main").innerHTML;
    P.paintProjectSettings();
    const settings = home.node("#main").innerHTML;
    const row = String(P.__get("writtenTo")({ folder: mirror, fileName: "lanterns.ec", published: "2026-10-20T07:00:00.000Z" }));
    const stats = String(P.__get("statsWhere")({ folder: mirror }));
    const all = [desksHtml, settings, row, stats].join("\n");
    /* The IT department's policy template now carries LeadKey alone and is offered on both folder and relay teams. */
    state(P, { cover: null, open: project(share), desks: Object.assign(await api.desks(), { folder: share }) });
    P.paintMain();
    const policy = home.node("#main").innerHTML.indexOf("data-it") >= 0 && desksHtml.indexOf("data-it") >= 0;
    shown[lang] = { named: [desksHtml, settings, row, stats].every((h) => h.indexOf(name) >= 0), policy,
      nothing: [mirror, mirror.split("\\").join("/"), ud, ud.split("\\").join("/"), rt, Relay.RELAY_URL, "etiuda.dev"].every((x) => all.indexOf(x) < 0),
      noChange: settings.indexOf('data-act="settings-folder"') < 0 };
  }
  /* The page's tell for a mirror is the store's shape and no other. */
  const home = loadPage({ api, uiLang: "en" }), on = home.page.__get("onRelay");
  const tell = { mirror: on(mirror) && on(mirror + path.sep) && on(K.relayMirror(K.teamsFile(path.join(lab, "ud2")), Relay.relayId())),
    others: !on(share) && !on("C:/quay/relay/team") && !on(path.join(ud, "relay", "not-a-relay-team-id")) && !on("") };
  const bad = [];
  ["en", "pl"].forEach((l) => Object.keys(seen[l]).forEach((k) => { if (k !== "labels" && seen[l][k] !== true) bad.push("ask " + l + " " + k); }));
  ["en", "pl"].forEach((l) => Object.keys(shown[l]).forEach((k) => { if (shown[l][k] !== true) bad.push("show " + l + " " + k); }));
  Object.keys(routes).forEach((k) => { if (routes[k] !== true) bad.push("press " + k); });
  Object.keys(tell).forEach((k) => { if (tell[k] !== true) bad.push("tell " + k); });
  check(bad.length === 0 && seen.en.labels[0] !== seen.pl.labels[0],
    "rs926d the page asks where a team is first made, the relay by default and a shared folder as it was, asks nothing of an existing team, and"
    + " shows the relay in place of the mirror's path, the address and the relay team id, in English and in Polish: "
    + (bad.length ? "failing " + JSON.stringify(bad) : "every part holds") + "; labels " + JSON.stringify(seen.en.labels) + " / " + JSON.stringify(seen.pl.labels));
};

/* ---- board 926, the test architect's edit E1: a press that fails after the thread's writes landed ------------------------ */

/* The thread as the shell has it, over the real verbs, with the fault a leg wants put in after the writes have landed: the
   reply never comes back, the reply comes back in a shape the store cannot keep, or the verb that takes the writes back
   cannot be asked. A leg clears `fault` for the press it makes next. */
function leadThread(S, fault) {
  return async (verb, ...a) => {
    if (verb !== "teamFacts" && verb !== "startRelayTeam" && verb !== "undoRelayTeam") return {};
    if (verb === "undoRelayTeam" && fault.cannotUndo) throw new Error("the thread could not be asked to take it back");
    const out = await S[verb](...a);
    if (verb !== "startRelayTeam") return out;
    if (fault.reply) throw new Error("the thread went away before its reply came");
    if (fault.store) { const loop = {}; loop.self = loop; return Object.assign({}, out, { written: loop }); }
    return out;
  };
}
/* What a lead's disk says of its team after a press: the store's teams and the keys it keeps for them, the team files in the
   mirrors, and the project's place and seal mark. A press leaves these three agreeing, a whole team or none. */
async function standing(R) {
  let book = {};
  try { book = JSON.parse(fs.readFileSync(R.teamsFile, "utf8")).teams || {}; } catch { book = {}; }
  const ids = Object.keys(book), keys = K.teamKeysOf(R.teamsFile, R.vault), base = path.join(R.ud, "relay"), files = {};
  for (const m of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const t = (await readTeam(path.join(base, m))).team;
    if (t) files[m] = t.id;
  }
  const p = R.projectJson();
  return { ids, keyed: ids.filter((t) => keys[t] && keys[t][1] && keys[t][1].length === 32), files, fileIds: Object.keys(files).map((m) => files[m]),
    folder: p.folder || null, mark: p.sealedTeam || null, relays: K.relayTeams(R.teamsFile) };
}
const wholeTeam = (s) => s.ids.length === 1 && s.keyed.length === 1 && s.fileIds.length === 1 && s.fileIds[0] === s.ids[0] && s.mark === s.ids[0]
  && s.relays.length === 1 && s.relays[0].team === s.ids[0] && s.folder === s.relays[0].folder && s.files[path.basename(s.relays[0].folder)] === s.ids[0];
const noTeam = (s) => s.ids.length === 0 && s.fileIds.length === 0 && s.folder === null && s.mark === null && s.relays.length === 0;
/* One press that fails after the thread's writes landed, what the disk says then, and the lead's next press. */
async function failThenPress(name, fault) {
  const lab = labDir("relay-" + name), R = await leadAtRest(lab, "Lantern Quay"), f = Object.assign({}, fault);
  const shell = await loadStudioShell(R.ud, { env: R.env, thread: leadThread(R.S, f) });
  const out = { first: null, mid: null, second: null, end: null };
  try {
    if (teamRelayHandler(shell)) {
      out.first = await shell.ask("studio:team-relay", R.proj);
      out.mid = await standing(R);
      f.reply = f.store = f.cannotUndo = false;
      out.second = await shell.ask("studio:team-relay", R.proj);
      if (out.second && !out.second.error) await shellSettled(shell);
      out.end = await standing(R);
    }
  } finally { shell.done(); }
  return out;
}
const HAS_TEAM = "This catalog has a team already, so no other was started.";

/* The thread's reply is lost after it wrote the team file and the project's place: the press is taken back whole (no team, key,
   mirror or file, the project's place and mark as they were), so the lead's next press is a first press and succeeds, leaving one
   team whose key, file and place agree. */
LEGS.rs926f = async () => {
  const r = await failThenPress("rs926f", { reply: true });
  const ok = { failed: !!r.first && !!r.first.error && r.first.error !== HAS_TEAM, takenBack: !!r.mid && noTeam(r.mid),
    pressed: !!r.second && r.second.error === null && r.second.relay === true && r.second.created === true, whole: !!r.end && wholeTeam(r.end) };
  check(Object.keys(ok).every((k) => ok[k]),
    "rs926f a press whose thread reply is lost after its writes landed is taken back whole, and the next press makes one team: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + (r.mid ? "; after the failure " + JSON.stringify({ teams: r.mid.ids.length, files: r.mid.fileIds.length, place: !!r.mid.folder, mark: !!r.mid.mark }) : "")
    + (r.second && r.second.error ? "; second press said " + JSON.stringify(r.second.error) : ""));
};

/* The store's own write fails after the thread wrote (the reply it is handed cannot be kept): the same. */
LEGS.rs926g = async () => {
  const r = await failThenPress("rs926g", { store: true });
  const ok = { failed: !!r.first && !!r.first.error && r.first.error !== HAS_TEAM, takenBack: !!r.mid && noTeam(r.mid),
    pressed: !!r.second && r.second.error === null && r.second.relay === true && r.second.created === true, whole: !!r.end && wholeTeam(r.end) };
  check(Object.keys(ok).every((k) => ok[k]),
    "rs926g a press whose store write fails after the thread's writes landed is taken back whole, and the next press makes one team: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + (r.mid ? "; after the failure " + JSON.stringify({ teams: r.mid.ids.length, files: r.mid.fileIds.length, place: !!r.mid.folder, mark: !!r.mid.mark }) : "")
    + (r.second && r.second.error ? "; second press said " + JSON.stringify(r.second.error) : ""));
};

/* Where the thread cannot be asked to take the writes back, the shell forgets nothing: the team, its key and its mirror stay
   with the team file and the project's place that point at them, so the key store never forgets a team whose file is there. */
LEGS.rs926h = async () => {
  const r = await failThenPress("rs926h", { reply: true, cannotUndo: true });
  const ok = { failed: !!r.first && !!r.first.error && r.first.error !== HAS_TEAM, kept: !!r.mid && wholeTeam(r.mid),
    refused: !!r.second && r.second.error === HAS_TEAM, stillWhole: !!r.end && wholeTeam(r.end) };
  check(Object.keys(ok).every((k) => ok[k]),
    "rs926h a press the thread cannot take back keeps the team, its key, its mirror, its file and the project's place together: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + (r.mid ? "; after the failure " + JSON.stringify({ teams: r.mid.ids.length, keyed: r.mid.keyed.length, files: r.mid.fileIds.length, place: !!r.mid.folder, mark: !!r.mid.mark }) : ""));
};

/* ---- board 926, the test architect's edit E2: the refusals, each with nothing written ---------------------------------------- */

/* Every file under a folder with its sha256, and every folder in it, so that "nothing was written" is two maps that are the same. */
function treeOf(root) {
  const out = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name), rel = path.relative(root, p).split(path.sep).join("/");
      if (e.isDirectory()) { out[rel + "/"] = "folder"; walk(p); } else out[rel] = sha(fs.readFileSync(p));
    }
  };
  walk(root);
  return out;
}
/* A project that already has a team in one of the three ways, which `setup` makes, and nothing else: a second press is refused in
   the handler's frame, and everything the lab holds (the teams file and the keys in it, the signing key, the relay folder, the
   share, the project and its draft) is byte for byte what it was. `only` says which of the handler's facts the setup leaves set,
   so the refusal is the one clause's and not another's. */
async function refusedWhole(name, setup, only) {
  const lab = labDir("relay-" + name), R = await leadAtRest(lab, "Lantern Quay"), share = path.join(lab, "share");
  fs.mkdirSync(share, { recursive: true });
  await setup(R, share);
  const facts = await R.S.teamFacts(R.proj, { key: R.keyAt });
  const kept = facts.folder ? K.teamForFolder(R.teamsFile, facts.folder) : null;
  const shell = await loadStudioShell(R.ud, { env: R.env, thread: R.thread });
  /* THE SHELL'S OWN START-UP WRITES SETTLE BEFORE THE SNAPSHOT. Loading the shell asks the licence once, and that look
     writes studio.json a moment later; alone it lands before the snapshot, but in a whole-file run under load it landed
     inside the press's window and read as the press writing (rs926k, twice, 2026-11-10). So the lab must hold still for
     400 ms, within 10 s, before "before" is taken (the test architect). */
  const settleTree = async () => {
    const end = Date.now() + 10000;
    let last = JSON.stringify(treeOf(lab)), still = 0;
    while (Date.now() < end && still < 400) {
      await wait(50);
      const now = JSON.stringify(treeOf(lab));
      if (now === last) still += 50; else { last = now; still = 0; }
    }
  };
  let reply = null, before = null, after = null;
  try {
    if (teamRelayHandler(shell)) { await settleTree(); before = treeOf(lab); reply = await shell.ask("studio:team-relay", R.proj); after = treeOf(lab); }
  } finally { shell.done(); }
  const was = JSON.stringify(before), now = JSON.stringify(after);
  const set = { mark: !!facts.mark, kept: !!kept, file: facts.file !== "none" && facts.file !== "theirs" };
  const ok = {
    only: Object.keys(set).every((k) => set[k] === (k === only)),
    refused: !!reply && !!reply.error && !!reply.said && reply.said.frame === HAS_TEAM,
    nothing: !!before && was === now,
  };
  return { ok, set, changed: before && after ? Object.keys(Object.assign({}, before, after)).filter((k) => before[k] !== after[k]) : ["no handler"] };
}
const refusedLine = (r) => Object.keys(r.ok).map((k) => k + " " + r.ok[k]).join(", ") + "; facts set " + JSON.stringify(r.set)
  + (r.changed.length ? "; changed " + JSON.stringify(r.changed.slice(0, 6)) : "");

/* A project that sealed before: it keeps the seal mark, its place has no team file and no team is kept for it. */
LEGS.rs926i = async () => {
  const r = await refusedWhole("rs926i", async (R, share) => {
    await R.S.setPublishFolder(R.proj, share);
    fs.writeFileSync(path.join(R.proj, "project.json"), JSON.stringify(Object.assign(R.projectJson(), { sealedTeam: "t-" + hex(8) }), null, 1) + "\n");
  }, "mark");
  check(Object.keys(r.ok).every((k) => r.ok[k]),
    "rs926i a project that sealed before is refused, with nothing written: " + refusedLine(r));
};

/* A project whose folder has a team kept for it: the Studio kept the team's file and key, and the file has gone from the folder. */
LEGS.rs926j = async () => {
  const r = await refusedWhole("rs926j", async (R, share) => {
    await R.S.setPublishFolder(R.proj, share);
    const id = "t-" + hex(8), key = crypto.randomBytes(32);
    K.keepTeamKey(R.teamsFile, R.vault, id, 1, key);
    const team = newTeam({ id, catalogs: [R.projectJson().id], lead: { keyId: R.made.keyId, public: R.made.public }, sealed: true, exportsSealed: true });
    const written = (await writeTeam(share, team, { key: R.keyAt, passphrase: labSecret(R.keyAt) })).team;
    K.chooseSealed(R.teamsFile, id, true, share, written);
    fs.unlinkSync(teamPath(share));
  }, "kept");
  check(Object.keys(r.ok).every((k) => r.ok[k]),
    "rs926j a project whose folder has a team kept for it is refused, with nothing written: " + refusedLine(r));
};

/* A project whose folder holds this Studio's own team: its file there, signed by this Studio's key, and nothing else says so. */
LEGS.rs926k = async () => {
  const r = await refusedWhole("rs926k", async (R, share) => {
    await R.S.setPublishFolder(R.proj, share);
    const id = "t-" + hex(8);
    const team = newTeam({ id, catalogs: [R.projectJson().id], lead: { keyId: R.made.keyId, public: R.made.public }, sealed: true, exportsSealed: true });
    await writeTeam(share, team, { key: R.keyAt, passphrase: labSecret(R.keyAt) });
  }, "file");
  check(Object.keys(r.ok).every((k) => r.ok[k]),
    "rs926k a project whose folder holds this Studio's own team is refused, with nothing written: " + refusedLine(r));
};

/* Q1 (Claude alpha's ruling of 2026-10-20 07:47), through the shell. A refusal of a desk whose invitation the relay reports unused
   moves nothing and asks nothing. A refusal of one it reports used, asked of the relay at the press whatever the book last
   heard, withdraws the invitation and writes the answer as before, moves nothing, and asks for the one confirm of Cancel: the
   page's second press (studio:invite-cancel) moves the team to a new key once, the next sync seals that key to the invitations
   left and never to the refused desk's, and its drop still waits out the hold. Where the relay does not answer but the book
   knows the invitation used, the lead is told the answer is owed and is asked for the same confirm. */
LEGS.s922move = async () => {
  const world = await relayWorld(), lab = labDir("relay-s922move");
  const S = await shellLead(world, lab, { invitations: ["Ada Quay", "Mira Lantern", "Nera Quay", "Orla Quay"], verbs: ["refuseDeskJoin"] });
  const [A, B, C, D] = S.inv;
  const blob = (i) => answerPlaces(world, S).indexOf("answer:" + i.ri.inv) >= 0;
  const refuse = (desk) => S.shell.ask("studio:desk-refuse", S.dir, desk);
  let why = "";
  try {
    const settled = await until(() => S.registered() && S.heard(), 20000);
    if (!settled) why = "the shell's first sync did not register and hear the invitations";
    /* a desk whose invitation the relay reports unused */
    const deskA = askFor(S, A);
    const a = settled ? await refuse(deskA) : null;
    const unusedOk = !!a && a.error === null && a.answerSaid === undefined && a.needsConfirm === undefined && a.pendingInvite === undefined
      && blob(A) && S.row(A).state === "withdrawn" && !!S.relayRow(A) && S.relayRow(A).gone === true && S.relayRow(A).pendingMove === false
      && !(a.invites || []).some((r) => r.id === A.made.id) && S.moves.length === 0 && (await S.epoch()) === 1;
    check(unusedOk, "s922unused a refusal of a desk whose invitation the relay reports unused moves nothing and asks nothing " + unusedOk
      + (a ? " (ask " + a.needsConfirm + ", moves " + S.moves.length + ", error " + JSON.stringify(a.error) + ")" : "") + (why ? ": " + why : ""));

    /* a desk whose invitation the relay reports used, the book not yet having heard it */
    if (S.shell && typeof S.shell.relaySync === "function") await S.shell.relaySync();
    process.env.STUDIO_TEST_RELAY_SYNC = "none";
    let spentB = false, deskB = null, fromB = 0, b = null, rowB = null;
    try {
      spentB = unusedOk && await S.spend(B);
      deskB = askFor(S, B);
      fromB = S.posts().length;
      b = spentB ? await refuse(deskB) : null;
      rowB = S.relayRow(B);
    } finally {
      delete process.env.STUDIO_TEST_RELAY_SYNC;
    }
    const pendingOk = !!b && b.error === null && b.answerSaid === undefined && b.needsConfirm === true && b.pendingInvite === B.made.id
      && blob(B) && S.row(B).state === "withdrawn" && !S.secretOf(B) && !!rowB && rowB.gone === true && rowB.pendingMove === true && rowB.dropAfter !== null
      && (b.invites || []).some((r) => r.id === B.made.id && r.pendingMove === true)
      && S.moves.length === 0 && (await S.epoch()) === 1 && dropsOf(S.posts().slice(fromB)).indexOf(B.ri.inv) < 0 && !!world.store(S.rt).get("inv:" + B.ri.inv);
    check(pendingOk, "s922move a refusal of a desk whose invitation the relay reports used writes the answer, withdraws the invitation, moves nothing and asks for the one confirm "
      + pendingOk + (b ? " (ask " + b.needsConfirm + ", for " + b.pendingInvite + ", moves " + S.moves.length + ", error " + JSON.stringify(b.error) + ")" : " (spent " + spentB + ")"));

    /* the confirm is Cancel's own: one move, the new key sealed to the invitations left and never to the refused desk's */
    const fromMove = S.posts().length;
    const done = pendingOk ? await S.cancel(B, true) : null;
    const epoch2 = (await S.epoch()) === 2;
    const wrapped = pendingOk ? await until(() => { const c = world.wrapOf(S.rt, C.ri.inv), d = world.wrapOf(S.rt, D.ri.inv);
      return !!c && !!d && c.epoch === 2 && d.epoch === 2; }, 20000) : false;
    const sent = S.posts().slice(fromMove), keyHex = S.keyAt2();
    const wrapC = wrapsOf(sent).find((w) => w.id === C.ri.inv);
    const openC = wrapC ? openSpec(C.secret, S.rt, S.teamId, C.ri.inv, wrapC.wrap) : null;
    const wrapB = world.wrapOf(S.rt, B.ri.inv);
    const moveOk = !!done && done.error === null && done.needsConfirm === false && done.moved === true && S.moves.length === 1 && epoch2
      && S.relayRow(B).pendingMove === false && !S.secretOf(B) && wrapped && !!openC && openC.epoch === 2 && openC.key === keyHex
      && wrapsOf(sent).every((w) => w.id !== B.ri.inv) && (!wrapB || wrapB.epoch === 1) && dropsOf(sent).indexOf(B.ri.inv) < 0
      && !!world.store(S.rt).get("inv:" + B.ri.inv);
    check(moveOk, "s922key the confirm moves the team to a new key once, the next sync seals it to the invitations left and never to the refused desk's, and the drop still waits "
      + moveOk + (done ? " (moved " + done.moved + ", moves " + S.moves.length + ", epoch 2 " + epoch2 + ", wrapped " + wrapped + ", wraps for it " + wrapsOf(sent).filter((w) => w.id === B.ri.inv).length + ")" : ""));

    /* the relay not answering, the book knowing the invitation used */
    const usedD = moveOk && await S.spend(D);
    const knownD = usedD && await S.sync(() => { const r = S.relayRow(D); return !!r && r.relayState === "used"; });
    const deskD = askFor(S, D);
    S.t.down = true;
    const d = knownD ? await refuse(deskD) : null;
    S.t.down = false;
    const rowD = S.relayRow(D);
    const offlineOk = !!d && d.error === null && d.answerSaid === Relay.ANSWER_UNSENT && d.needsConfirm === true && d.pendingInvite === D.made.id
      && !blob(D) && !!rowD && !!rowD.owed && rowD.pendingMove === true && S.moves.length === 1 && (await S.epoch()) === 2;
    check(offlineOk, "s922offline the relay not answering, a refusal of a desk the book knows used tells the lead the answer is owed and asks for the same confirm "
      + offlineOk + (d ? " (said " + JSON.stringify(d.answerSaid) + ", ask " + d.needsConfirm + ", moves " + S.moves.length + ")" : " (used " + usedD + ", known " + knownD + ")"));
  } catch (e) {
    check(false, "s922move threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally { await S.shell.done(); }
};

/* The page opens Cancel's own confirm on a refusal the shell says needs it, and the press on it sends the confirm for that invitation. */
LEGS.s922cover = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const Studio = await import("../src/studio.mjs");
  const lab = labDir("relay-s922cover");
  const born = await Studio.newProject(path.join(lab, "page"), "Harbour Lamps", ["en"]);
  const dir = born && born.dir ? born.dir : born;
  const open = JSON.parse(JSON.stringify(await Studio.openProject(dir)));
  const inviteId = "0123456789abcdef", member = "k-e5c80a17b2e4d856", asking = "k-0011223344556677";
  let pending = false;
  const calls = [];
  const screen = () => ({ error: null, folder: dir, id: "harbour-lamps", mark: null, signing: "studio-harbour", file: "ours",
    reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, autoAdmit: false, keyOpens: true, inviteName: "Mira Lantern",
    requests: [{ id: asking, name: "Desk Nine", key: "a".repeat(64), asked: "2026-10-20T08:00:00.000Z", state: "asks", kind: "desk", door: "invitation", invite: "valid", inviteId }],
    invites: pending ? [{ id: inviteId, name: "Mira Lantern", person: "Piotr Quay", made: "2026-10-13T08:00:00.000Z", expires: "2026-10-20T08:00:00.000Z",
      code: "", relay: true, used: null, deskName: "", pendingMove: true }] : [],
    team: { id: "t-0123456789abcdef", epoch: 1, relay: true, sealed: true, lists: true, exportsSealed: true, recovery: false, leadPrint: "abcd",
      roster: [{ id: member, name: "Ewa's desk", own: "", key: "e5c80a17b2e4d856", admitted: true, kind: "desk", door: "invitation" }] } });
  const api = {
    desks: async () => JSON.parse(JSON.stringify(screen())),
    deskRefuse: async () => { pending = true; return JSON.parse(JSON.stringify(Object.assign(screen(), { needsConfirm: true, pendingInvite: inviteId }))); },
    inviteCancel: async (d, id, confirm) => {
      calls.push({ d, id, confirm });
      pending = false;
      return JSON.parse(JSON.stringify(Object.assign(screen(), { needsConfirm: false, moved: true })));
    },
  };
  const home = loadPage({ api, uiLang: "en" });
  const P = home.page;
  Object.assign(P.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
  await P.desksLoad();
  await P.ACTS["desk-refuse"]({ getAttribute: (k) => (k === "data-id" ? asking : null) });
  const dlg = home.node("#dlg").innerHTML;
  const covered = P.S.cover === "team" && P.S.teamWant === "cancel" && P.S.cancelId === inviteId && /data-act="do-invite-cancel"/.test(dlg) && calls.length === 0;
  await P.ACTS["do-invite-cancel"]();
  const sent = calls.length === 1 && calls[0].id === inviteId && calls[0].confirm === true && calls[0].d === dir && P.S.cover === null;
  check(covered && sent, "s922cover a refusal the shell says needs the confirm opens Cancel's own cover on that invitation " + covered + ", and its press sends the confirm for it " + sent);
};

/* The test architect's R2, through the shell's own studio:publish (driven with no window over the lab's relay): a lead with a relay team
   publishes, and the moment the publish returns, before the watch, a focus or any timer, the relay holds the edition's head and the team
   file's ring, so a desk of the team that opens its channel then reads both. The shell's first sync has settled before the press, so
   what the relay holds at that moment is the team file as first written, with no ring key and no head. */
LEGS.r2pub = async () => {
  const world = await relayWorld(), lab = labDir("relay-r2pub"), D = deskKeys();
  const S = await shellLead(world, lab, { roster: [D], verbs: ["publishProject"] });
  signedIn(S.ud);
  const seqNow = () => { const s = world.store(S.rt); return s ? (s.get("seq") || 0) : 0; };
  const Studio = await import("../src/studio.mjs");
  const shelf = (await Studio.addTag(S.dir, "shelf", { en: "Openers" })).tag.id;
  await Studio.addCard(S.dir, shelf, "Warm opening", "Good day, and welcome to Lantern Quay.");
  let why = "", desk = null, hold = false, release = null;
  try {
    const first = await until(() => !!world.store(S.rt) && !!world.store(S.rt).get("team") && seqNow() > 0, 20000);
    if (first) { for (let was = -1; was !== seqNow();) { was = seqNow(); await wait(300); } }
    else why = "the shell's first sync did not reach the relay";
    const before = seqNow();
    const reply = first ? await S.shell.ask("studio:publish", S.dir, { notes: "Edition one." }) : null;
    const after = seqNow();
    const landed = !!reply && reply.error === null && reply.refused === null && typeof reply.edition === "string";
    const k1 = (K.teamKeysOf(S.teamsFile, S.vault)[S.teamId] || {})[1];
    const held = new Map([[1, k1 ? Buffer.from(k1) : null]]);
    desk = deskOf(world, lab, S, "desk", D, held);
    desk.ch.start(); await settle(desk.ch);
    let head = null, doc = null;
    try { head = JSON.parse(read(desk.mirror, Relay.HEAD_NAME)); } catch { head = null; }
    try { doc = JSON.parse(read(desk.mirror, world.C.TEAM_NAME)); } catch { doc = null; }
    const entry = head && Array.isArray(head.editions) ? head.editions[0] : null;
    const headOk = !!head && head.team === S.teamId && !!entry && !!reply && entry.edition === reply.edition;
    const ringOk = !!doc && !!doc.ring && Array.isArray(doc.ring.keys) && doc.ring.keys.some((k) => k && k.keyId === S.lead.keyId && k.public === S.lead.public);
    const ok = landed && headOk && ringOk && after > before;
    check(ok, "r2pub right after a publish on a relay team, before any timer or focus, the relay holds the edition's head " + headOk
      + " and the team file's ring " + ringOk + ", and the publish landed " + landed + " (the relay took " + (after - before) + " writes by the time the press returned)"
      + (reply && reply.error ? ": " + JSON.stringify(reply.error) : "") + (why ? ": " + why : ""));

    await wait(500);

    /* condition E1: a publish press waits a bounded time when the relay does not answer */
    process.env.STUDIO_PUBLISH_SYNC_WAIT_MS = "50";
    hold = true;
    S.t.answer = async () => (hold ? new Promise((r) => { release = r; }) : null);
    const hangSafety = setTimeout(() => {
      hold = false;
      if (release) release({ status: 503, header: () => null, bytes: Buffer.alloc(0) });
    }, 10000); /* the relay stays silent for ten seconds, far past the bound; the test architect's E1 */
    await Studio.addCard(S.dir, shelf, "Second card", "Still here.");
    const t0 = Date.now();
    const reply2 = await S.shell.ask("studio:publish", S.dir, { notes: "Edition two." });
    const elapsed = Date.now() - t0;
    clearTimeout(hangSafety);
    hold = false;
    if (release) release({ status: 503, header: () => null, bytes: Buffer.alloc(0) });
    delete process.env.STUDIO_PUBLISH_SYNC_WAIT_MS;
    const landed2 = !!reply2 && reply2.error === null && reply2.refused === null && typeof reply2.edition === "string";
    const boundOk = landed2 && elapsed < 2000 && reply2.syncPending === true;
    check(boundOk, "r2bound a publish on a relay team when the relay does not answer returns within the bound " + boundOk
      + " (took " + elapsed + "ms, edition " + (reply2 && reply2.edition) + ", syncPending " + (reply2 && reply2.syncPending) + ")"
      + (reply2 && reply2.error ? ": " + JSON.stringify(reply2.error) : ""));

    /* condition E1, the late catch-up: a relay that answers the catch-up only after its bound, and the publish's own sync inside its
       wait, still leaves the press marked not in step, since it was numbered from a mirror that may have been behind. */
    process.env.STUDIO_PUBLISH_SYNC_WAIT_MS = "1000";
    await Studio.addCard(S.dir, shelf, "Late card", "Still here.");
    const tLate = Date.now();
    S.t.answer = async () => { const left = 1500 - (Date.now() - tLate); if (left > 0) await wait(left); return null; };
    const replyLate = await S.shell.ask("studio:publish", S.dir, { notes: "Edition late." });
    const elapsedLate = Date.now() - tLate;
    S.t.answer = null;
    delete process.env.STUDIO_PUBLISH_SYNC_WAIT_MS;
    const lateOk = !!replyLate && replyLate.error === null && replyLate.refused === null && typeof replyLate.edition === "string"
      && replyLate.syncPending === true && !replyLate.syncFailed;
    check(lateOk, "r2late a publish whose catch-up the relay answers only after the bound is marked not in step (syncPending) " + lateOk
      + " (took " + elapsedLate + "ms, edition " + (replyLate && replyLate.edition) + ", syncPending " + (replyLate && replyLate.syncPending)
      + ", syncFailed " + (replyLate && replyLate.syncFailed) + ")" + (replyLate && replyLate.error ? ": " + JSON.stringify(replyLate.error) : ""));
    await wait(500);

    /* condition E1: the landing line shows whenever this publish's sync ended without the relay holding the edition */
    const { loadPage } = await import("./page-stand-in.mjs");
    const failLineEn = "The relay could not be reached just now. The edition is written, and Studio sends it at its next look, within a few minutes; nothing more needs doing.";
    const failLinePl = "Nie udało się teraz połączyć z przekaźnikiem. Wydanie jest zapisane, a Studio wyśle je przy następnym sprawdzeniu, w ciągu kilku minut; nic więcej nie trzeba robić.";
    const pageLineOf = (r, lang) => {
      try {
        const home = loadPage({ api: {}, uiLang: lang });
        home.page.S.open = { dir: S.dir, folder: S.mirror };
        home.page.__get("prLanded")(r, {}, home.page.__get("prDeskLine")());
        return String(home.node("#pressedBody") ? home.node("#pressedBody").textContent : "").replace(/\s+/g, " ").trim();
      } catch { return ""; }
    };

    /* case 1: the lab relay itself refuses the publish's upload */
    S.t.answer = async (method, url) => {
      if (method === "PUT" && /\/b\/[0-9a-f]{32}$/.test(String(url))) {
        return { status: 503, header: () => null, bytes: Buffer.from(JSON.stringify({ error: "unavailable" })) };
      }
      return null;
    };
    await Studio.addCard(S.dir, shelf, "Third card", "Still here.");
    const reply3 = await S.shell.ask("studio:publish", S.dir, { notes: "Edition three." });
    S.t.answer = null;
    const landed3 = !!reply3 && reply3.error === null && reply3.refused === null && typeof reply3.edition === "string";
    const body3En = pageLineOf(reply3, "en"), body3Pl = pageLineOf(reply3, "pl");
    const fail1Ok = landed3 && reply3.syncFailed === true && !reply3.syncPending
      && body3En.includes(failLineEn) && body3Pl.includes(failLinePl);
    check(fail1Ok, "r2fail a publish whose upload the lab relay refuses lands with syncFailed true and Claudette's failure sentence " + fail1Ok
      + " (edition " + (reply3 && reply3.edition) + ", syncFailed " + (reply3 && reply3.syncFailed) + ", syncPending " + (reply3 && reply3.syncPending) + ")"
      + (reply3 && reply3.error ? ": " + JSON.stringify(reply3.error) : ""));

    /* case 2: the lab relay cannot be reached */
    S.t.down = true;
    await Studio.addCard(S.dir, shelf, "Fourth card", "Still here.");
    const reply4 = await S.shell.ask("studio:publish", S.dir, { notes: "Edition four." });
    S.t.down = false;
    const landed4 = !!reply4 && reply4.error === null && reply4.refused === null && typeof reply4.edition === "string";
    const body4En = pageLineOf(reply4, "en"), body4Pl = pageLineOf(reply4, "pl");
    const fail2Ok = landed4 && reply4.syncFailed === true && !reply4.syncPending
      && body4En.includes(failLineEn) && body4Pl.includes(failLinePl);
    check(fail2Ok, "r2fail a publish when the lab relay cannot be reached lands with syncFailed true and Claudette's failure sentence " + fail2Ok
      + " (edition " + (reply4 && reply4.edition) + ", syncFailed " + (reply4 && reply4.syncFailed) + ", syncPending " + (reply4 && reply4.syncPending) + ")"
      + (reply4 && reply4.error ? ": " + JSON.stringify(reply4.error) : ""));

    /* case 3: the relay takes the edition, and the flag is absent */
    await Studio.addCard(S.dir, shelf, "Fifth card", "Still here.");
    const reply5 = await S.shell.ask("studio:publish", S.dir, { notes: "Edition five." });
    const landed5 = !!reply5 && reply5.error === null && reply5.refused === null && typeof reply5.edition === "string";
    const body5En = pageLineOf(reply5, "en");
    const fail3Ok = landed5 && !reply5.syncFailed && !reply5.syncPending
      && !body5En.includes(failLineEn) && !body5En.includes("shortly");
    check(fail3Ok, "r2fail a publish when the relay takes the edition lands with syncFailed absent " + fail3Ok
      + " (edition " + (reply5 && reply5.edition) + ", syncFailed " + (reply5 && reply5.syncFailed) + ", syncPending " + (reply5 && reply5.syncPending) + ")"
      + (reply5 && reply5.error ? ": " + JSON.stringify(reply5.error) : ""));
  } finally {
    hold = false;
    if (release) release({ status: 503, header: () => null, bytes: Buffer.alloc(0) });
    delete process.env.STUDIO_PUBLISH_SYNC_WAIT_MS;
    if (S && S.t) { S.t.down = false; S.t.answer = null; }
    await S.shell.done();
    if (desk) await desk.ch.stop();
  }
};

/* ---- board 935, slice G3: the relay comes with a licence --------------------------------------------------------------------- */

/* The pinned engine's vector, and the keys it is made over (relay/test/grant-vector.json: test keys that sign nothing real). */
const VECTOR = () => JSON.parse(fs.readFileSync(path.join(ROOT, "engine", "pinned", "relay", "test", "grant-vector.json"), "utf8"));
const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");

/* The root a grant must trace to is the vendor's, the one Studio embeds for a licence; and the shared vector, made by the engine for
   every program that judges a grant, holds through Studio's own door (src/relay.mjs grantRefusal, which asks the pinned relay's grantOk):
   both grants hold under the vector's root, neither under the vendor's, neither at its end, neither for another lead. */
LEGS.rs935a = async () => {
  const core = Engine.relayRules().core, Lic = await import("../src/licence.mjs"), V = VECTOR();
  const g = V.grants, roots = [V.root.pub], both = [g.root.grant, g.delegated.grant];
  /* Each case its own sentence since N1 (Relay.GRANT_SAID by why). */
  const refused = (r, why) => !!r && r.ok === false && r.reason === "grant" && r.why === why && r.said === Relay.GRANT_SAID[why];
  const ok = {
    rootIsVendors: /^[0-9a-f]{64}$/.test(core.ROOT_PUB) && core.ROOT_PUB === Lic.EMBEDDED_VENDOR_ROOT_KEY,
    controlTestRootIsNot: core.ROOT_PUB !== V.root.pub && GRANT_ROOT_PUB === V.root.pub && V.root.pub !== Lic.EMBEDDED_VENDOR_ROOT_KEY,
    hold: both.every((x) => Relay.grantRefusal(x, V.lead.pub, V.now, roots) === null),
    notVendors: both.every((x) => { const r = Relay.grantRefusal(x, V.lead.pub, V.now); return !!r && r.ok === false && r.reason === "grant"; }),
    ended: both.every((x) => refused(Relay.grantRefusal(x, V.lead.pub, x.until, roots), "ended")),
    otherLead: both.every((x) => refused(Relay.grantRefusal(x, V.root.pub, V.now, roots), "lead")),
    none: refused(Relay.grantRefusal(null, V.lead.pub, V.now, roots), "none") && refused(Relay.grantRefusal(undefined, V.lead.pub, V.now, roots), "none"),
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rs935a the root a grant traces to is the vendor's, and the engine's shared vector holds through Studio's door: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + "; the pinned ROOT_PUB " + core.ROOT_PUB.slice(0, 12) + ", Studio's " + Lic.EMBEDDED_VENDOR_ROOT_KEY.slice(0, 12));
};

/* Studio's create is the vector's: given the vector's lead, its grant and its time, the body Studio posts carries that grant and the
   lead's signature over the create-2 bytes, the very signature the vector holds (Ed25519 is deterministic). */
LEGS.rs935b = async () => {
  const V = VECTOR(), posted = [];
  const request = async (method, url, headers, body) => {
    posted.push({ method, url: String(url), body: JSON.parse(Buffer.from(body).toString("utf8")) });
    return { status: 200, bytes: Buffer.from("{}"), header: () => null };
  };
  const privateKey = crypto.createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, Buffer.from(V.lead.seed, "hex")]), format: "der", type: "pkcs8" });
  const open = { keyId: V.lead.keyId, public: V.lead.pub, privateKey };
  const grant = V.grants[V.create.grant].grant;
  const r = await Relay.relaySpace({ url: Relay.RELAY_URL, rt: V.create.rt, open, request, t: V.create.t, grant, roots: [V.root.pub] });
  const b = posted.length === 1 ? posted[0].body : null;
  const ok = {
    made: r.ok === true && posted.length === 1 && posted[0].method === "POST" && posted[0].url === Relay.RELAY_URL + "/teams",
    fields: !!b && Object.keys(b).sort().join() === "grant,lead,rt,sig,t" && b.rt === V.create.rt && b.t === V.create.t
      && b.lead.keyId === V.lead.keyId && b.lead.pub === V.lead.pub,
    grant: !!b && JSON.stringify(b.grant) === JSON.stringify(grant),
    signature: !!b && b.sig === V.create.sig,
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rs935b Studio's create over the engine's vector carries its grant and the lead's signature over the create-2 bytes, the vector's own: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

/* A lead with no grant, one whose grant has ended, one whose grant names another key, one the root did not sign and one that
   will not read: the runner sends no create, makes no team and says why; and a good grant placed afterwards makes the team at the
   next sync, so nothing was spent or lost. */
LEGS.rs935c = async () => {
  const world = await relayWorld(), DAY = 24 * 60 * 60 * 1000;
  const cases = [
    ["no grant", { noGrant: true }, "none"],
    ["an ended grant", { grantOpts: { fields: { issued: Date.now() - 10 * DAY, until: Date.now() - DAY } } }, "ended"],
    ["a grant for another key", { grantOpts: { fields: { lead: keyPair(false).pub } } }, "lead"],
    ["a grant the root did not sign", { grantOpts: { signer: grantKit.DELEGATE } }, "signature"],
    ["a file that is no grant", { noGrant: true, garbage: true }, "none"],
  ];
  const seen = [];
  for (const [name, opts, why] of cases) {
    const lab = labDir("relay-rs935c"), s = await studioLead(world, lab, opts);
    try {
      if (opts.garbage) fs.writeFileSync(path.join(path.dirname(s.keyAt), "relay-grant.json"), "{ this is not a grant");
      const out = await s.runner.sync(); await s.runner.idle();
      const first = out[0] || {};
      const creates = s.t.log.filter((l) => l === "POST teams").length;
      const none = !world.store(s.rt) || !world.store(s.rt).get("team");
      const row = K.relayTeams(s.teamsFile)[0];
      /* Then the good grant, placed afterwards. */
      granted(s.keyAt, s.lead.public);
      await s.runner.sync(); await s.runner.idle();
      const made = !!world.store(s.rt) && !!world.store(s.rt).get("team");
      seen.push({ name, ok: first.ok === false && first.reason === "grant" && first.why === why,
        said: first.said === (Relay.GRANT_SAID ? (Relay.GRANT_SAID[why] || Relay.GRANT_SAID.other) : null), creates, none, notCreated: !!row && row.created === false,
        after: made && s.t.log.filter((l) => l === "POST teams").length === 1 && K.relayTeams(s.teamsFile)[0].created === true, why });
    } finally { await s.runner.stop(); }
  }
  const bad = seen.filter((x) => !(x.ok && x.said && x.creates === 0 && x.none && x.notCreated && x.after));
  check(seen.length === cases.length && bad.length === 0,
    "rs935c a lead with no grant, an ended one, one for another key, one the root did not sign or a file that is no grant sends no create and makes no team,"
    + " and a good grant placed afterwards makes it at the next sync: " + seen.map((x) => x.name + " " + JSON.stringify({ sent: x.creates, none: x.none, said: x.said, after: x.after })).join("; "));
};

/* The lead's choice of the relay, through the shell's own handler, with a key and no grant that holds: it is refused in the licence
   sentence, with nothing written (the lab, byte for byte as it was), no request and no team; the cases are none, ended, another
   key's and a file that is no grant. The shared folder is the other choice and is not this handler's. */
async function relayRefused(name, o, noKey) {
  const lab = labDir("relay-" + name), R = await leadAtRest(lab, "Lantern Quay", noKey, o);
  if (o && o.garbage) fs.writeFileSync(path.join(R.ud, "relay-grant.json"), "{ this is not a grant");
  const shell = await loadStudioShell(R.ud, { env: Object.assign({}, R.env, noKey ? { STUDIO_KEY_PASSPHRASE: "" } : {}), thread: R.thread });
  /* THE SHELL'S OWN START-UP WRITES SETTLE BEFORE THE SNAPSHOT. Loading the shell asks the licence once, and that look
     writes studio.json a moment later; alone it lands before the snapshot, but in a whole-file run under load it landed
     inside the press's window and read as the press writing (rs926k, twice, 2026-11-10). So the lab must hold still for
     400 ms, within 10 s, before "before" is taken (the test architect). */
  const settleTree = async () => {
    const end = Date.now() + 10000;
    let last = JSON.stringify(treeOf(lab)), still = 0;
    while (Date.now() < end && still < 400) {
      await wait(50);
      const now = JSON.stringify(treeOf(lab));
      if (now === last) still += 50; else { last = now; still = 0; }
    }
  };
  let reply = null, before = null, after = null;
  try {
    if (teamRelayHandler(shell)) { await settleTree(); before = treeOf(lab); reply = await shell.ask("studio:team-relay", R.proj); after = treeOf(lab); }
  } finally { await shell.done(); }
  const spoke = shell.said.filter((l) => /relay of team|relay could not/.test(l));
  const wantFrame = noKey ? (Relay.GRANT_SAID ? Relay.GRANT_SAID.nokey : null)
    : (o && o.noGrant && !o.garbage) ? (Relay.GRANT_SAID ? Relay.GRANT_SAID.none : null)
    : (o && o.grantOpts && o.grantOpts.fields && o.grantOpts.fields.until) ? (Relay.GRANT_SAID ? Relay.GRANT_SAID.ended : null)
    : (o && o.grantOpts && o.grantOpts.fields && o.grantOpts.fields.lead) ? (Relay.GRANT_SAID ? Relay.GRANT_SAID.lead : null)
    : (o && o.grantOpts && o.grantOpts.signer) ? (Relay.GRANT_SAID ? Relay.GRANT_SAID.other : null)
    : (o && o.garbage) ? (Relay.GRANT_SAID ? Relay.GRANT_SAID.none : null)
    : (Relay.GRANT_SAID ? Relay.GRANT_SAID.other : null);
  const wantDate = (o && o.grantOpts && o.grantOpts.fields && o.grantOpts.fields.until)
    ? new Date(o.grantOpts.fields.until).toISOString().slice(0, 10) : null;
  const wantError = wantDate && wantFrame ? wantFrame.replace("{DATE}", wantDate) : wantFrame;
  const saidOk = !!reply && !!wantFrame && !!reply.said && reply.said.frame === wantFrame
    && reply.error === wantError
    && (wantDate ? (!!reply.said.vars && reply.said.vars.DATE === wantDate) : true);
  return { R, reply, nothing: !!before && JSON.stringify(before) === JSON.stringify(after), spoke, relays: K.relayTeams(R.teamsFile).length,
    place: R.projectJson().folder === null && !R.projectJson().sealedTeam, key: fs.existsSync(R.keyAt),
    said: saidOk };
}
const refusedLine935 = (r) => "said " + r.said + ", nothing written " + r.nothing + ", no relay team " + (r.relays === 0) + ", project's place untouched " + r.place
  + ", no relay sync " + (r.spoke.length === 0);
LEGS.rs935d = async () => {
  const DAY = 24 * 60 * 60 * 1000;
  const cases = [
    ["no grant", { noGrant: true }],
    ["an ended grant", { grantOpts: { fields: { issued: Date.now() - 10 * DAY, until: Date.now() - DAY } } }],
    ["a grant for another key", { grantOpts: { fields: { lead: keyPair(false).pub } } }],
    ["a grant the root did not sign", { grantOpts: { signer: grantKit.DELEGATE } }],
    ["a file that is no grant", { noGrant: true, garbage: true }],
  ];
  const out = [];
  for (const [name, o] of cases) { const r = await relayRefused("rs935d", o); out.push([name, r]); }
  const bad = out.filter(([, r]) => !(r.said && r.nothing && r.relays === 0 && r.place && r.spoke.length === 0 && r.key));
  check(out.length === cases.length && bad.length === 0,
    "rs935d the lead's choice of the relay, through the shell's own handler, is refused in the licence sentence with nothing written where the lead has no grant that"
    + " holds: " + out.map(([n, r]) => n + " (" + refusedLine935(r) + ")").join("; "));
};

/* A Studio with no signing key holds no grant, for a grant names a key: the relay is refused in the same sentence, nothing is made
   (the relay no longer makes the key, as a team on a folder does), and the lead is left to the folder. This leg was the first team making
   the key on the relay (rs926e), which a grant that names a key can no longer allow. */
LEGS.rs926e = async () => {
  const r = await relayRefused("rs926e", undefined, true);
  const ok = { none: !r.key, said: r.said, nothing: r.nothing, quiet: r.relays === 0 && r.place && r.spoke.length === 0 };
  check(Object.keys(ok).every((k) => ok[k]),
    "rs926e a Studio with no signing key, asked for the relay, is refused in the licence sentence and makes nothing, neither the key nor a team: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

/* A good grant makes the team through the shell's own handler, as rs926a drives it, and the shell's own sync carries the grant to the
   lab's relay, which keeps the grant's end and whether it is paid, a trial's or a paid licence's, and Studio sent exactly one create,
   whose body holds the grant. */
LEGS.rs935e = async () => {
  const world = await relayWorld(), DAY = 24 * 60 * 60 * 1000, got = [];
  for (const paid of [true, false]) {
    const lab = labDir("relay-rs935e"), R = await leadAtRest(lab, "Lantern Quay", false, { grantOpts: { fields: { paid } } });
    const t = world.transport("shell-" + paid);
    const shell = await loadStudioShell(R.ud, { relay: t, env: R.env, thread: R.thread });
    let reply = null, rec = null;
    try {
      if (teamRelayHandler(shell)) reply = await shell.ask("studio:team-relay", R.proj);
      rec = K.relayTeams(R.teamsFile)[0] || null;
      if (rec) await until(() => !!world.store(rec.rt) && !!world.store(rec.rt).get("team"), 20000);
    } finally { await shell.done(); }
    const kept = rec && world.store(rec.rt) ? world.store(rec.rt).get("team") : null;
    const creates = t.sent.filter((l) => /^POST https:\/\/etiuda\.dev\/relay\/v1\/teams\n/.test(l));
    const body = creates.length === 1 ? JSON.parse(creates[0].slice(creates[0].lastIndexOf("\n") + 1)) : null;
    got.push({ paid, made: !!reply && reply.error === null && reply.relay === true && !!kept,
      lead: !!kept && kept.lead.pub === R.made.public, until: !!kept && kept.until === R.grant.until, paidKept: !!kept && kept.paid === paid,
      oneCreate: creates.length === 1 && !!body && JSON.stringify(body.grant) === JSON.stringify(R.grant) });
  }
  check(got.length === 2 && got.every((x) => Object.keys(x).every((k) => k === "paid" || x[k] === true)),
    "rs935e a good grant makes the team through the shell's own handler and sync, the relay keeps the grant's end and its paid, and Studio sends one create with the grant in it: "
    + got.map((x) => (x.paid ? "paid" : "trial") + " " + JSON.stringify(x)).join("; "));
};

/* The cover: the refusal is said under the choice, in English and in Polish, and the shared folder is still on offer there: the press
   on the relay leaves the cover open with the sentence, the folder is chosen from it, and its press goes the folder's way. */
LEGS.rs935f = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const lab = labDir("relay-rs935f"), share = "C:/quay/share", S0 = await import("../src/studio.mjs");
  const made = await S0.newProject(path.join(lab, "projects"), "Lantern Quay", [{ code: "en", name: "English" }]);
  const dir = made.dir, base = await S0.openProject(dir), calls = [];
  const frame = Relay.GRANT_SAID.none;
  const api = { teamRelay: async (d) => { calls.push(["relay", d]); return { error: frame, said: { frame, vars: {} } }; },
    teamSealed: async (d, sealed, fresh) => { calls.push(["folder", d, sealed, fresh]); return { error: null, folder: share, created: true, team: { id: "t-0123456789abcdef" } }; },
    desks: async () => ({ folder: null, file: "none", signing: "studio-0123456789abcdef", requests: [], canKeep: true, team: null }),
    pickFolder: async () => ({ folder: null }) };
  const seen = {};
  for (const lang of ["en", "pl"]) {
    const home = loadPage({ api, uiLang: lang }), P = home.page;
    Object.assign(P.S, { open: Object.assign({}, base, { project: Object.assign({}, base.project, { folder: null }) }), host: { tour: { offered: true } },
      screen: "projects", home: "team", teamDir: base.dir, cover: "team", teamWant: "sealed", teamWhere: "relay", err: null, dkNote: null, q: "",
      desks: { folder: share, file: "none", signing: "studio-0123456789abcdef", requests: [], canKeep: true, team: null } });
    calls.length = 0;
    try { await P.ACTS["do-team-seal"](); } catch { /* a repaint the stand-in cannot finish; the calls and the cover are what is read */ }
    const html = String(P.teamCoverHtml()), said = P.T(frame);
    const relayCall = calls.length === 1 && calls[0][0] === "relay";
    const offers = html.indexOf('data-act="team-where" data-v="folder"') < 0 && html.indexOf(P.T("a shared folder")) < 0;
    const open = P.S.cover === "team" && !!P.S.err;
    const sentence = html.indexOf(said.replace(/&/g, "&amp;")) >= 0 && (lang === "en" ? said === frame : said !== frame);
    P.ACTS["team-where"]({ getAttribute: () => "folder" });
    calls.length = 0;
    try { await P.ACTS["do-team-seal"](); } catch { /* as above */ }
    const folderWay = calls.length === 1 && calls[0][0] === "relay";
    seen[lang] = { relayCall, open, offers, sentence, folderWay };
  }
  const bad = [];
  for (const l of ["en", "pl"]) for (const k of Object.keys(seen[l])) if (seen[l][k] !== true) bad.push(l + " " + k);
  check(bad.length === 0,
    "rs935f the cover says the licence refusal in English and in Polish when the shell refuses the press, stays open, no longer offers a shared folder (it did, until 2026-11-20), and a forced folder answer's press goes the relay's way: "
    + (bad.length ? "failing " + JSON.stringify(bad) : "every part holds"));
};

/* The handler: each of the six refusal cases says its own sentence in English and Polish with nothing sent and nothing written. */
LEGS.rs935n = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const homePl = loadPage({ uiLang: "pl" });
  const DAY = 24 * 60 * 60 * 1000;
  const endedUntil = Date.now() - DAY;
  const endedDate = new Date(endedUntil).toISOString().slice(0, 10);
  const cases = [
    ["case a (no key)", { noKey: true }, Relay.GRANT_SAID && Relay.GRANT_SAID.nokey, null],
    ["case b (no grant)", { noGrant: true }, Relay.GRANT_SAID && Relay.GRANT_SAID.none, null],
    ["case c (ended)", { grantOpts: { fields: { issued: Date.now() - 10 * DAY, until: endedUntil } } }, Relay.GRANT_SAID && Relay.GRANT_SAID.ended, { DATE: endedDate }],
    ["case d (another key)", { grantOpts: { fields: { lead: keyPair(false).pub } } }, Relay.GRANT_SAID && Relay.GRANT_SAID.lead, null],
    ["case e (future)", { grantOpts: { fields: { issued: Date.now() + 10 * DAY, until: Date.now() + 20 * DAY } } }, Relay.GRANT_SAID && Relay.GRANT_SAID.future, null],
    ["case f (not a grant)", { notGrant: true }, Relay.GRANT_SAID && Relay.GRANT_SAID.other, null],
  ];
  const out = [];
  for (const [name, o, wantFrame, wantVars] of cases) {
    const lab = labDir("relay-rs935n-" + name.replace(/[^a-z0-9]/gi, "_"));
    const noKey = !!o.noKey;
    const R = await leadAtRest(lab, "Lantern Quay", noKey, o);
    if (o.notGrant) fs.writeFileSync(path.join(R.ud, "relay-grant.json"), JSON.stringify({ kind: "not-a-grant", note: "not a grant" }));
    /* A lab relay of this case's own, its every call counted: what reaches it is what was sent. */
    const world = await relayWorld(), lane = world.transport("shell"), sentCalls = [];
    const relay = { request: async (method, url, headers, body) => { sentCalls.push(String(method) + " " + String(url)); return lane.request(method, url, headers, body); },
      connect: lane.connect };
    const shell = await loadStudioShell(R.ud, { relay, env: Object.assign({}, R.env, noKey ? { STUDIO_KEY_PASSPHRASE: "" } : {}), thread: R.thread });
    let reply = null, before = null, after = null;
    try {
      if (teamRelayHandler(shell)) { before = treeOf(lab); reply = await shell.ask("studio:team-relay", R.proj); after = treeOf(lab); }
    } finally { await shell.done(); }
    /* Nothing sent: this case's own lab relay heard no call (the test architect's E1 on the combined run), and nothing was kept:
       no relay team, the project's place and seal untouched. The shell's said lines are not read: they gather every runner's
       stderr in the process, and in a whole run a runner an earlier leg left going writes into them. */
    const nothingWritten = !!before && JSON.stringify(before) === JSON.stringify(after);
    const nothingSent = sentCalls.length === 0 && K.relayTeams(R.teamsFile).length === 0 && R.projectJson().folder === null
      && !R.projectJson().sealedTeam;
    const wantEn = wantVars && wantFrame ? wantFrame.replace("{DATE}", wantVars.DATE) : wantFrame;
    const wantPl = wantFrame ? homePl.page.T(wantFrame, wantVars || {}) : "";
    const enOk = !!reply && !!wantEn && reply.error === wantEn && !!reply.said && reply.said.frame === wantFrame
      && (wantVars ? (!!reply.said.vars && reply.said.vars.DATE === wantVars.DATE) : true);
    const plActual = reply && reply.said ? homePl.page.T(reply.said.frame, reply.said.vars || {}) : null;
    const plOk = !!wantPl && plActual === wantPl && plActual !== wantEn;
    out.push({ name, enOk, plOk, nothingWritten, nothingSent, error: reply && reply.error, plActual });
  }
  const bad = out.filter((x) => !(x.enOk && x.plOk && x.nothingWritten && x.nothingSent));
  check(out.length === cases.length && bad.length === 0,
    "rs935n each of the six refusal cases says its own sentence in English and Polish with nothing sent and nothing written: "
    + (bad.length ? "failed " + JSON.stringify(bad) : out.map((x) => x.name + " ok").join(", ")));
};

/* Board 934, condition 4 of the test architect's triage of 2026-10-20: Studio's states call goes to the route the relay has,
   GET /t/<relay team id>/states, which the pinned relay answers only to the lead's session, and reads {states: [{id, state,
   usedAt}]}. The lab answers no path of its own for it, so every state heard here is the pin's. */
LEGS.rs934a = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs934a");
  const s = await studioLead(world, lab);
  const invite = (name) => {
    const secret = newSecret(), ri = Relay.relayInvite(secret);
    const made = makeInvite({ team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } },
      name, secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
    K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
    return { id: made.id, ri };
  };
  const spent = invite("Mira Lantern"), idle = invite("Tomas Quay");
  const rowOf = (x) => K.relayInvitesOf(s.teamsFile, s.vault, s.teamId).find((i) => i.id === x.id) || {};
  const word = (r) => (r.relayState || "none") + " at " + (r.relayUsed == null ? "no time" : r.relayUsed);
  await s.runner.sync(); await s.runner.idle();
  const first = [rowOf(spent), rowOf(idle)];
  const bothUnused = first.every((r) => r.relayState === "unused" && r.relayUsed == null);
  /* A desk's token hello, bound to a key of its own, spends one invitation at the relay. */
  const desk = world.transport("rs934a-desk");
  const json = { "content-type": "application/json" };
  const hello = JSON.parse((await desk.request("POST", Relay.RELAY_URL + "/t/" + s.rt + "/hello", json, Buffer.from("{}"))).bytes.toString("utf8"));
  await desk.request("POST", Relay.RELAY_URL + "/t/" + s.rt + "/session", json,
    Buffer.from(JSON.stringify(boundToken(world, s.rt, hello.challenge, spent.ri.inv, spent.ri.token))));
  const relayAt = (world.store(s.rt).get("inv:" + spent.ri.inv) || {}).spentAt;
  await s.runner.sync(); await s.runner.idle();
  const [usedRow, idleRow] = [rowOf(spent), rowOf(idle)];
  check(bothUnused && Number.isFinite(relayAt) && usedRow.relayState === "used" && usedRow.relayUsed === relayAt
    && idleRow.relayState === "unused" && idleRow.relayUsed == null,
    "rs934a the relay's own states route is heard: both invitations read unused before any desk came (" + word(first[0]) + ", "
    + word(first[1]) + "), then the one a desk used reads used at the relay's time (" + word(usedRow) + ", the relay's " + relayAt
    + ") and the other unused (" + word(idleRow) + ")");
  const asked = s.t.log.filter((l) => l === "GET states").length;
  const other = s.t.log.filter((l) => /states/.test(l) && l !== "GET states");
  const probe = await world.transport("rs934a-probe").request("POST", Relay.RELAY_URL + "/t/" + s.rt + "/invite-states", json, Buffer.from("{}"));
  const probed = JSON.parse(probe.bytes.toString("utf8"));
  check(asked >= 2 && other.length === 0 && probe.status === 404 && probed.error === "missing",
    "rs934a Studio's states calls are GET states and nothing else (" + asked + " of them, others: " + (other.join(", ") || "none")
    + "), and the lab's relay has no invite-states path of its own: it answers " + probe.status + " " + probed.error);
  await s.runner.stop();
};

/* ---- R1, the test architect's condition of the first-hour triage (2026-10-20): the published edition comes along ------------ */

/* A project that published before its team moved: rev 1 into a share that holds no team, signed by `key` (the lead's, unless a
   leg says otherwise) or, with `key` false, not signed. Answers the share and the publish. */
async function publishedBefore(R, lab, key) {
  const share = path.join(lab, "share");
  const named = key === false ? { ...LIC } : { leadKey: key || R.keyAt, key: key || R.keyAt, passphrase: labSecret(key || R.keyAt), ...LIC };
  const pub = await R.S.publishProject(R.proj, Object.assign({ folder: share, notes: "Edition one.", now: "2026-10-20T07:00:00.000Z", teamKeys: {} }, named));
  return { share, pub };
}
/* The lead presses the relay through the shell's handler, and what the mirror holds at that moment, before any sync, is read.
   Then a desk is invited, asks, is admitted by the thread's own watch, and catches up through the lab relay: what its mirror
   holds, and the key it was wrapped, are read. The desk's side is the pinned channel's, as in rs6. */
async function moveThenAdmit(world, lab, R, thread) {
  const shell = await loadStudioShell(R.ud, { env: R.env, thread: thread || R.thread });
  let reply = null;
  try { if (teamRelayHandler(shell)) { reply = await shell.ask("studio:team-relay", R.proj); await shellSettled(shell); } } finally { shell.done(); }
  const rec = K.relayTeams(R.teamsFile)[0] || null;
  if (!rec) return { reply, rec: null };
  const mirror = rec.folder, lines = [], rootNames = () => (fs.existsSync(mirror) ? fs.readdirSync(mirror) : []);
  const atMove = { ec: rootNames().filter((n) => /\.ec$/i.test(n)), ring: rootNames().indexOf("etiuda-ring.json") >= 0 };
  const secret = newSecret(), ri = Relay.relayInvite(secret);
  const target = { team: rec.team, folder: mirror, lead: { keyId: R.made.keyId, public: R.made.public } };
  const made = makeInvite(target, "Ada Quay", secret, Date.now(), undefined, { rt: rec.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
  K.keepInvite(R.teamsFile, R.vault, rec.team, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
  const t = world.transport("studio");
  const runner = trackRunner({ roots: GRANT_ROOTS, teamsFile: R.teamsFile, vault: R.vault, keyFile: R.keyAt, secret: () => labSecret(R.keyAt), request: t.request,
    connect: t.connect, watch: false, pollMs: 1e9, say: (l) => lines.push(l) });
  await runner.sync(); await runner.idle();
  const s = { rt: rec.rt, teamId: rec.team, lead: { keyId: R.made.keyId, public: R.made.public } };
  const N = deskKeys(), held = new Map();
  const joiner = deskOf(world, lab, s, "joiner", N, held, { invite: () => ({ inv: ri.inv, token: ri.token, seal: ri.seal }) });
  put(joiner.mirror, "desks/" + N.keyId + "/join.json", JSON.stringify(joinRequest(rec.team, N, { id: made.id, secret }), null, 1) + "\n");
  joiner.ch.start(); await settle(joiner.ch);
  await runner.sync(); await runner.idle();
  joiner.t.down = true;
  const admitted = await R.S.watchAdmit(mirror, R.keyAt, labSecret(R.keyAt), { auto: false, teamKeys: K.teamKeysOf(R.teamsFile, R.vault),
    invites: K.inviteBookOf(R.teamsFile, R.vault), teamsFile: R.teamsFile });
  for (const x of admitted.spent || []) K.endInvite(R.teamsFile, rec.team, x.invite, "spent", x.desk);
  await runner.sync(); await runner.idle(); await runner.sync(); await runner.idle();
  joiner.t.down = false;
  await settle(joiner.ch);
  await runner.sync(); await runner.idle(); await settle(joiner.ch);
  const names = (fs.existsSync(joiner.mirror) ? fs.readdirSync(joiner.mirror) : []).filter((n) => /\.ec$/i.test(n));
  const key = held.get(1) || null;
  let edition = null;
  try { edition = JSON.parse(Engine.sealRules().openSealed(key, JSON.parse(read(joiner.mirror, names[0] || "none.ec")))); } catch { edition = null; }
  let deskTeam = null;
  try { deskTeam = Engine.teamRules().v2TeamRead(read(joiner.mirror, world.C.TEAM_NAME)).team; } catch { deskTeam = null; }
  const stop = async () => { await joiner.ch.stop(); await runner.stop(); };
  return { reply, rec, mirror, lines, atMove, admitted, joiner, held, names, edition, deskTeam, stop,
    leadsFile: read(mirror, world.C.TEAM_NAME), deskFile: read(joiner.mirror, world.C.TEAM_NAME) };
}
const ringHolds = (team, id, made) => !!team && !!team.ring && Array.isArray(team.ring.keys)
  && team.ring.keys.some((e) => e && e.catalog === id && e.keyId === made.keyId && e.public === made.public);

/* A project that published rev 1 (to its own folder, with no team), then makes a relay team through the handler, has the edition
   and the ring in the mirror before the first sync, sealed as the team's are; a desk invited and admitted finds rev 1 on its
   first catch-up, its edition and the ring, and the folder the project published to is as the publish left it. */
LEGS.rsr1a = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsr1a"), R = await leadAtRest(lab, "Lantern Quay");
  const { share, pub } = await publishedBefore(R, lab);
  const was = treeOf(share), id = R.projectJson().id;
  const M = await moveThenAdmit(world, lab, R);
  if (!M.rec) { check(false, "rsr1a no relay team was made" + (M.reply && M.reply.error ? ": " + M.reply.error : "")); return; }
  const archived = JSON.parse(fs.readFileSync(path.join(pub.archive, "catalog.ec"), "utf8"));
  const name = path.basename(pub.ec);
  const T = Engine.teamRules(), sig = M.deskTeam ? await T.v2TeamSigState(M.deskTeam) : T.states.none;
  const ok = {
    published: !!pub && pub.refused === null && pub.rev === 1,
    moved: !!M.reply && M.reply.error === null && M.reply.relay === true && R.projectJson().folder === M.mirror,
    beforeSync: M.atMove.ec.length === 1 && M.atMove.ec[0] === name && M.atMove.ring,
    sealed: (() => { try { const d = JSON.parse(read(M.mirror, name)); return d.kind === Engine.sealRules().SEALED_KIND && d.team === M.rec.team && d.epoch === 1; } catch { return false; } })(),
    admitted: (M.admitted.admitted || []).length === 1 && M.held.has(1),
    deskEdition: M.names.length === 1 && M.names[0] === name && !!M.edition && M.edition.id === id && M.edition.rev === 1
      && JSON.stringify(M.edition) === JSON.stringify(archived) && M.edition.date === pub.edition,
    deskRing: !!M.deskTeam && sig === T.states.valid && ringHolds(M.deskTeam, id, R.made) && M.deskFile === M.leadsFile,
    oldPlace: JSON.stringify(treeOf(share)) === JSON.stringify(was),
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rsr1a a project that published rev 1 and then makes a relay team has its edition and ring in the mirror before the first sync, sealed as the team's are, and an admitted desk's first catch-up holds rev 1 and the ring: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + "; desk holds " + JSON.stringify(M.names) + ", rev " + (M.edition && M.edition.rev) + ", at the move " + JSON.stringify(M.atMove)
    + (M.lines.length ? " (" + M.lines.slice(0, 2).join(" | ") + ")" : ""));
  await M.stop();
};

/* The control: a project that never published moves as it did, with nothing published, and the admitted desk is told of no
   catalog and no error: the mirror holds the team file alone, the desk holds the team and its key and no edition. */
LEGS.rsr1b = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsr1b"), R = await leadAtRest(lab, "Lantern Quay");
  const M = await moveThenAdmit(world, lab, R);
  if (!M.rec) { check(false, "rsr1b no relay team was made" + (M.reply && M.reply.error ? ": " + M.reply.error : "")); return; }
  const ok = {
    moved: !!M.reply && M.reply.error === null && M.reply.relay === true && R.projectJson().folder === M.mirror,
    nothingCarried: M.atMove.ec.length === 0 && M.atMove.ring === false,
    nothingPublished: !fs.existsSync(path.join(R.proj, "archive")) || fs.readdirSync(path.join(R.proj, "archive")).length === 0,
    admitted: (M.admitted.admitted || []).length === 1 && M.held.has(1) && !!M.deskTeam && M.deskFile === M.leadsFile,
    noCatalog: M.names.length === 0 && !M.deskTeam.ring.keys.length,
    noError: M.lines.length === 0 && M.joiner.ch.online(),
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rsr1b a project that never published moves as before, and the admitted desk gets no catalog and no error: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + (M.lines.length ? " (" + M.lines.slice(0, 2).join(" | ") + ")" : ""));
  await M.stop();
};

/* An edition no key of this lead's signed, or none signed, is not carried: the desk would have no ring entry to trust it by.
   The move is made as for a project that never published, nothing is written for the edition, and the old place is untouched. */
LEGS.rsr1c = async () => {
  const got = {};
  for (const how of ["other", "unsigned"]) {
    const lab = labDir("relay-rsr1c-" + how), R = await leadAtRest(lab, "Lantern Quay");
    let key;
    if (how === "other") {
      key = path.join(R.ud, "other-key.json");
      fs.writeFileSync(key, JSON.stringify(await labLeadKey(), null, 1) + "\n");
    } else key = false;
    const { share, pub } = await publishedBefore(R, lab, key);
    const was = treeOf(share);
    const shell = await loadStudioShell(R.ud, { env: R.env, thread: R.thread });
    let reply = null;
    try { if (teamRelayHandler(shell)) { reply = await shell.ask("studio:team-relay", R.proj); await shellSettled(shell); } } finally { shell.done(); }
    const rec = K.relayTeams(R.teamsFile)[0] || null;
    const root = rec && fs.existsSync(rec.folder) ? fs.readdirSync(rec.folder) : ["no mirror"];
    got[how] = { published: pub.rev === 1, moved: !!reply && reply.error === null && !!rec && R.projectJson().folder === rec.folder,
      nothing: root.filter((n) => /\.ec$/i.test(n) || n === "etiuda-ring.json").length === 0, oldPlace: JSON.stringify(treeOf(share)) === JSON.stringify(was) };
  }
  check(Object.keys(got).every((h) => Object.keys(got[h]).every((k) => got[h][k])),
    "rsr1c an edition signed by another key, or by none, is not carried, and the move is made as before: " + JSON.stringify(got));
};

/* A press that fails after the thread carried the edition is taken back whole: no team or key kept, nothing left in the relay
   folder (neither the sealed edition nor the ring), the project's place and mark as the publish left them and the old place
   untouched; the next press carries the edition into one team whose key, file and place agree. */
LEGS.rsr1d = async () => {
  const lab = labDir("relay-rsr1d"), R = await leadAtRest(lab, "Lantern Quay"), f = { reply: true };
  const { share, pub } = await publishedBefore(R, lab);
  const was = treeOf(share), name = path.basename(pub.ec), base = path.join(R.ud, "relay");
  const left = () => (fs.existsSync(base) ? Object.keys(treeOf(base)).filter((k) => !/\/$/.test(k)) : []);
  const shell = await loadStudioShell(R.ud, { env: R.env, thread: leadThread(R.S, f) });
  const out = {};
  try {
    if (teamRelayHandler(shell)) {
      out.first = await shell.ask("studio:team-relay", R.proj);
      out.mid = await standing(R); out.midLeft = left(); out.midFolder = R.projectJson().folder;
      f.reply = false;
      out.second = await shell.ask("studio:team-relay", R.proj);
      if (out.second && !out.second.error) await shellSettled(shell);
      out.end = await standing(R); out.endLeft = left();
    }
  } finally { shell.done(); }
  const ok = {
    failed: !!out.first && !!out.first.error && out.first.error !== HAS_TEAM,
    noTeam: !!out.mid && out.mid.ids.length === 0 && out.mid.fileIds.length === 0 && out.mid.relays.length === 0 && out.mid.mark === null,
    nothingLeft: !!out.midLeft && out.midLeft.length === 0,
    placeBack: !!out.mid && out.midFolder === path.resolve(share),
    oldPlace: JSON.stringify(treeOf(share)) === JSON.stringify(was),
    pressed: !!out.second && out.second.error === null && out.second.relay === true,
    whole: !!out.end && wholeTeam(out.end),
    carried: !!out.endLeft && out.endLeft.some((k) => k.endsWith("/" + name)) && out.endLeft.some((k) => k.endsWith("/etiuda-ring.json")),
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rsr1d a press that fails after the edition was carried is taken back whole, with the sealed edition and the ring gone from the relay folder, and the next press carries it: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + "; left after the failure " + JSON.stringify(out.midLeft));
};

/* An undo after the draft id has changed still takes back the file carryEdition wrote. The name follows the catalog id
   where the project has no fixed file name and the archived report names none, a publish from before file names were
   kept; with a fixed name the draft id does not change the file, so this leg takes that name off before the move.
   A note already in the mirror is left byte for byte. The team file and the ring go with the undo, as they do for a
   press that is taken back whole. */
LEGS.rsr1e = async () => {
  const lab = labDir("relay-rsr1e"), R = await leadAtRest(lab, "Lantern Quay");
  const { share, pub } = await publishedBefore(R, lab);
  const project = R.projectJson();
  delete project.fileName;
  fs.writeFileSync(path.join(R.proj, "project.json"), JSON.stringify(project, null, 1) + "\n");
  const report = JSON.parse(fs.readFileSync(path.join(pub.archive, "report.json"), "utf8"));
  delete report.file;
  fs.writeFileSync(path.join(pub.archive, "report.json"), JSON.stringify(report, null, 1) + "\n");
  const previousId = String(JSON.parse(fs.readFileSync(path.join(R.proj, project.draft || "draft.json"), "utf8")).id || "");
  const shell = await loadStudioShell(R.ud, { env: R.env, thread: R.thread });
  let reply = null;
  try { if (teamRelayHandler(shell)) { reply = await shell.ask("studio:team-relay", R.proj); await shellSettled(shell); } } finally { shell.done(); }
  const rec = K.relayTeams(R.teamsFile)[0] || null;
  if (!reply || reply.error || !rec) {
    check(false, "rsr1e no relay team was made" + (reply && reply.error ? ": " + reply.error : ""));
    return;
  }
  const mirror = rec.folder;
  const ecs = fs.existsSync(mirror) ? fs.readdirSync(mirror).filter((n) => /\.ec$/i.test(n)) : [];
  const carriedName = ecs.length === 1 ? ecs[0] : "";
  let sealed = false;
  try {
    const d = JSON.parse(fs.readFileSync(path.join(mirror, carriedName), "utf8"));
    sealed = d.kind === Engine.sealRules().SEALED_KIND && d.team === rec.team;
  } catch { sealed = false; }
  const noteName = "quay-note.txt";
  fs.writeFileSync(path.join(mirror, noteName), "A note that was already in the mirror.\n");
  const before = treeOf(mirror);
  const draftAt = path.join(R.proj, project.draft || "draft.json");
  const draft = JSON.parse(fs.readFileSync(draftAt, "utf8"));
  draft.id = crypto.randomUUID();
  const nextId = String(draft.id);
  fs.writeFileSync(draftAt, JSON.stringify(draft, null, 1) + "\n");
  let undoError = "";
  try { await R.S.undoRelayTeam(R.proj, { teamId: rec.team, rt: rec.rt, mirror, folder: share }); }
  catch (e) { undoError = String(e && e.message || e); }
  const after = fs.existsSync(mirror) ? treeOf(mirror) : null;
  const teamName = Engine.teamRules().V2_TEAM_FILE;
  const spared = Object.keys(before).filter((k) => k !== carriedName && k !== "etiuda-ring.json" && k !== teamName);
  const ok = {
    named: carriedName === previousId + ".ec" && nextId !== previousId && sealed,
    gone: !!after && after[carriedName] === undefined,
    untouched: !!after && spared.indexOf(noteName) >= 0 && spared.every((k) => after[k] === before[k])
      && Object.keys(after).every((k) => before[k] !== undefined),
    undo: undoError === "",
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rsr1e an undo after the draft id changed takes back the edition carry wrote, and a file already in the mirror is untouched: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + "; carried " + carriedName
    + ", draft " + previousId + " then " + nextId + (undoError ? "; undo said " + undoError : "")
    + (after ? "; left " + JSON.stringify(Object.keys(after)) : "; mirror gone"));
};

/* An edition whose signature names this lead's key, and does not verify under that key's public half, is not carried.
   One letter of the archived catalog is changed after signing, and the signature's key id and value are left as they
   were. The move is made as for an edition signed by another key: nothing is written for the edition, and the old
   place is untouched. */
LEGS.rsr1f = async () => {
  const lab = labDir("relay-rsr1f"), R = await leadAtRest(lab, "Lantern Quay");
  const { share, pub } = await publishedBefore(R, lab);
  const catalogAt = path.join(pub.archive, "catalog.ec");
  const original = fs.readFileSync(catalogAt, "utf8");
  const parsed = JSON.parse(original);
  const swapped = original.replace("Lantern Quay", "Lantern Quaz");
  fs.writeFileSync(catalogAt, swapped);
  const afterDoc = JSON.parse(fs.readFileSync(catalogAt, "utf8"));
  const sameKey = !!parsed.sig && parsed.sig.keyId === R.made.keyId && !!afterDoc.sig
    && afterDoc.sig.keyId === parsed.sig.keyId && afterDoc.sig.value === parsed.sig.value;
  const was = treeOf(share);
  const shell = await loadStudioShell(R.ud, { env: R.env, thread: R.thread });
  let reply = null;
  try { if (teamRelayHandler(shell)) { reply = await shell.ask("studio:team-relay", R.proj); await shellSettled(shell); } } finally { shell.done(); }
  const rec = K.relayTeams(R.teamsFile)[0] || null;
  const root = rec && fs.existsSync(rec.folder) ? fs.readdirSync(rec.folder) : ["no mirror"];
  const ok = {
    tampered: swapped !== original && sameKey && swapped.length === original.length,
    moved: !!reply && reply.error === null && !!rec && R.projectJson().folder === rec.folder,
    nothing: root.filter((n) => /\.ec$/i.test(n) || n === "etiuda-ring.json").length === 0,
    oldPlace: JSON.stringify(treeOf(share)) === JSON.stringify(was),
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rsr1f an edition whose signature names the lead key and does not verify is not carried, and the move is made as before: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + "; mirror " + JSON.stringify(root));
};

/* ---- Board 962 stage 5, section 4: carryEdition never writes over another catalog in the team's place -------------------- */

/* A project that published, and whose relay team is made through the shell's handler as rsr1c's is, with the edition carried
   into the mirror. Answers what a leg needs to call carryEdition again: the mirror, the file name, the team and its key. */
async function carriedTeam(lab) {
  const R = await leadAtRest(lab, "Lantern Quay");
  const { share, pub } = await publishedBefore(R, lab);
  const shell = await loadStudioShell(R.ud, { env: R.env, thread: R.thread });
  let reply = null;
  try { if (teamRelayHandler(shell)) { reply = await shell.ask("studio:team-relay", R.proj); await shellSettled(shell); } } finally { shell.done(); }
  const rec = K.relayTeams(R.teamsFile)[0] || null;
  const teamKeys = K.teamKeysOf(R.teamsFile, R.vault);
  const key = rec && teamKeys[rec.team] ? teamKeys[rec.team][1] : null;
  return { R, share, pub, reply, rec, teamKeys, key, name: path.basename(pub.ec), mirror: rec ? rec.folder : "" };
}
/* A catalog of another id, invented here, as the bytes a sealed or plain file of another catalog would hold. */
const otherCatalog = (id) => JSON.stringify({ format: 2, id, rev: 3, langs: [{ code: "en", label: "English" }], cards: [] }) + "\n";
async function carryAgain(C) {
  const Pub = await import("../src/publish.mjs");
  try { return { out: await Pub.carryEdition({ project: C.R.proj, folder: C.mirror, key: C.R.keyAt, teamKeys: C.teamKeys }), frame: Pub.CARRY_TAKEN_REFUSAL }; }
  catch (e) { return { error: e, frame: Pub.CARRY_TAKEN_REFUSAL }; }
}

/* A team's place holding another catalog's file under the name this catalog's edition is carried by: sealed for the same team
   under its key, in the clear, and sealed for a team whose key this Studio does not hold. carryEdition is refused in its own
   frame, naming the file, and the place is byte for byte as it was, the other file and the ring included. */
LEGS.rsce1 = async () => {
  const C = await carriedTeam(labDir("relay-rsce1"));
  if (!C.rec || !C.key) { check(false, "rsce1 no relay team was made" + (C.reply && C.reply.error ? ": " + C.reply.error : "")); return; }
  const S = Engine.sealRules(), got = {};
  const kinds = {
    sealedOther: () => JSON.stringify(S.sealCatalog(C.key, C.rec.team, 1, otherCatalog("harbour-other-list")), null, 1) + "\n",
    plainOther: () => otherCatalog("harbour-plain-list"),
    foreignSeal: () => JSON.stringify(S.sealCatalog(crypto.randomBytes(32), "t-00000000000000f1", 1, otherCatalog("harbour-foreign-list")), null, 1) + "\n",
  };
  for (const k of Object.keys(kinds)) {
    fs.writeFileSync(path.join(C.mirror, C.name), kinds[k]());
    const before = treeOf(C.mirror);
    const r = await carryAgain(C);
    const said = r.error && r.error.said;
    got[k] = {
      refused: !!said && said.frame === r.frame && said.vars.FILE === C.name && !r.out,
      untouched: JSON.stringify(treeOf(C.mirror)) === JSON.stringify(before),
    };
  }
  check(Object.keys(got).every((k) => got[k].refused && got[k].untouched),
    "rsce1 carryEdition into a team's place holding another catalog's file of the same name (sealed for the team, in the clear, sealed for"
    + " a team not held here) is refused in its own frame, naming the file, and the place is byte for byte as it was: " + JSON.stringify(got));
};

/* The control: an older edition of this same catalog, sealed for the team, under that name is written over with the latest, as
   carryEdition always did. rev 1 and rev 2 are published; the move carries rev 2; rev 1 is put back; a second carry brings rev 2. */
LEGS.rsce2 = async () => {
  const lab = labDir("relay-rsce2"), R0 = await leadAtRest(lab, "Lantern Quay");
  const share = path.join(lab, "share"), named = { leadKey: R0.keyAt, key: R0.keyAt, passphrase: labSecret(R0.keyAt), teamKeys: {}, ...LIC };
  const one = await R0.S.publishProject(R0.proj, Object.assign({ folder: share, notes: "Edition one.", now: "2026-10-20T07:00:00.000Z" }, named));
  let two = null;
  try {
    const tagId = (await R0.S.addTag(R0.proj, "shelf", { en: "Closers" })).tag.id;
    await R0.S.addCard(R0.proj, tagId, "Warm closing", "Thank you, and good evening from Lantern Quay.");
    two = await R0.S.publishProject(R0.proj, Object.assign({ folder: share, notes: "Edition two.", now: "2026-10-20T08:00:00.000Z" }, named));
  } catch (e) { two = { refused: String(e && e.message || e) }; }
  const shell = await loadStudioShell(R0.ud, { env: R0.env, thread: R0.thread });
  let reply = null;
  try { if (teamRelayHandler(shell)) { reply = await shell.ask("studio:team-relay", R0.proj); await shellSettled(shell); } } finally { shell.done(); }
  const rec = K.relayTeams(R0.teamsFile)[0] || null;
  const teamKeys = K.teamKeysOf(R0.teamsFile, R0.vault), key = rec && teamKeys[rec.team] ? teamKeys[rec.team][1] : null;
  if (!rec || !key || !two || two.rev !== 2) {
    check(false, "rsce2 no relay team over two editions was made" + (reply && reply.error ? ": " + reply.error : "") + (two && two.refused ? "; " + two.refused : ""));
    return;
  }
  const C = { R: R0, mirror: rec.folder, teamKeys }, name = path.basename(two.ec), S = Engine.sealRules();
  const older = fs.readFileSync(path.join(one.archive, "catalog.ec"), "utf8");
  fs.writeFileSync(path.join(C.mirror, name), JSON.stringify(S.sealCatalog(key, rec.team, 1, older), null, 1) + "\n");
  const opened = () => { try { return JSON.parse(S.openSealed(key, JSON.parse(fs.readFileSync(path.join(C.mirror, name), "utf8")))); } catch { return null; } };
  const was = opened();
  const r = await carryAgain(C);
  const now = opened();
  /* Grok's review 29, finding 2: a NEWER edition of this catalog in the place (rev 9, another Studio's of the team) stays as it is,
     and nothing is carried over it. */
  const newer = Object.assign(JSON.parse(older), { rev: 9 });
  fs.writeFileSync(path.join(C.mirror, name), JSON.stringify(S.sealCatalog(key, rec.team, 1, JSON.stringify(newer)), null, 1) + "\n");
  const r9 = await carryAgain(C), kept9 = opened();
  const ok = {
    olderInPlace: !!was && was.rev === 1,
    carried: !r.error && !!r.out && r.out.rev === 2 && r.out.ec === path.join(C.mirror, name),
    latest: !!now && now.rev === 2 && JSON.stringify(now) === JSON.stringify(JSON.parse(fs.readFileSync(path.join(two.archive, "catalog.ec"), "utf8"))),
    newerStays: !r9.error && r9.out === null && !!kept9 && kept9.rev === 9,
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rsce2 carryEdition over an older edition of the same catalog, sealed for the team, still writes the latest, and leaves a newer one (rev 9) as it is: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + (r.error ? "; said " + r.error.message : ""));
};

/* The path through startRelayTeam: a relay folder that already holds, under this catalog's name, another catalog sealed for the
   very team being made (the shape a team of several catalogs takes). The press is refused in carryEdition's frame, the other
   catalog's file stays byte for byte (taken back neither by the write nor by the undo after it), no team file is left, and the
   project still publishes where it did. */
LEGS.rsce3 = async () => {
  const lab = labDir("relay-rsce3"), R = await leadAtRest(lab, "Lantern Quay");
  const { share, pub } = await publishedBefore(R, lab);
  const Pub = await import("../src/publish.mjs");
  const rt = crypto.randomBytes(16).toString("hex"), teamId = "t-" + crypto.randomBytes(8).toString("hex"), key = crypto.randomBytes(32);
  const mirror = path.join(R.ud, "relay", rt), name = path.basename(pub.ec);
  fs.mkdirSync(mirror, { recursive: true });
  fs.writeFileSync(path.join(mirror, name), JSON.stringify(Engine.sealRules().sealCatalog(key, teamId, 1, otherCatalog("harbour-other-list")), null, 1) + "\n");
  const before = treeOf(mirror), projectWas = fs.readFileSync(path.join(R.proj, "project.json"), "utf8");
  let error = null, out = null;
  try {
    out = await R.S.startRelayTeam(R.proj, { key: R.keyAt, passphrase: labSecret(R.keyAt), teamKeys: { [teamId]: { 1: key } }, teamId, rt, mirror, url: Relay.RELAY_URL });
  } catch (e) { error = e; }
  const said = error && error.said;
  const ok = {
    refused: !out && !!said && said.frame === Pub.CARRY_TAKEN_REFUSAL && said.vars.FILE === name,
    otherKept: fs.existsSync(path.join(mirror, name)) && JSON.stringify(treeOf(mirror)) === JSON.stringify(before),
    noTeamFile: !fs.existsSync(teamPath(mirror)),
    placeKept: fs.readFileSync(path.join(R.proj, "project.json"), "utf8") === projectWas,
  };
  check(Object.keys(ok).every((k) => ok[k]),
    "rsce3 startRelayTeam into a relay folder holding another catalog sealed for the same team under this catalog's name is refused in"
    + " carryEdition's frame, the other file stays byte for byte, no team file is left and the project's place is unchanged: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + (error && !said ? "; threw " + error.message : "")
    + "; left " + JSON.stringify(fs.existsSync(mirror) ? Object.keys(treeOf(mirror)) : null));
};

/* Board 920. The shell keeps the next epoch's key before removeMember writes the team file. Until that write lands the
   key is pending: the catch-up must not seal an owed root file under it, a desk must still be taken at the current
   epoch, and a sealed publish must write. The removal retried uses that same key and completes at the next epoch. */
LEGS.rs920 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs920");
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true });
  const S = await import("../src/studio.mjs");
  const proj = (await S.newProject(path.join(lab, "projects"), "Quay lamps", [{ code: "en", name: "English" }])).dir;
  const shelf = (await S.addTag(proj, "shelf", { en: "General" })).tag.id;
  await S.addCard(proj, shelf, "Quay lamp", "A quay lamp, lit at dusk.");
  S.setPublishFolder(proj, s.mirror);
  await S.setTeamSealed(proj, true, { key: s.keyAt, passphrase: labSecret(s.keyAt), teamId: s.teamId, /* the relay team studioLead made, sealed by the verb (it writes a team on the relay) */
    teamKeys: K.teamKeysOf(s.teamsFile, s.vault) });
  await s.runner.sync(); await s.runner.idle();
  const desk = deskOf(world, lab, s, "desk", D, new Map([[1, s.teamKey]]));
  desk.ch.start();
  await settle(desk.ch);
  const nextKey = crypto.randomBytes(32);
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, 2, nextKey);
  if (typeof K.markKeyPending === "function") K.markKeyPending(s.teamsFile, s.teamId, 2);
  const owed = "{\"kind\":\"etiuda-note\",\"note\":\"A root file the lead owes the relay\"}\n";
  put(s.mirror, "owed-root.ec", owed);
  const pendingOf = (file, team) => (typeof K.pendingEpochsOf === "function" ? (K.pendingEpochsOf(file)[team] || []) : []);
  let removeThrew = false, pubWhy = "", retryWhy = "";
  let stayed = false, noNext = false, taken = false, published = false, retried = false;
  try {
    await s.runner.sync(); await s.runner.idle();
    await Relay.catchUpBeforeMove(s.runner, s.teamId);
    try {
      await S.removeMember(proj, s.keyAt, s.teamId, D.keyId, "", {
        confirm: true, teamKeys: K.teamKeysOf(s.teamsFile, s.vault), nextKey, nextEpoch: 2, teamsFile: s.teamsFile,
      });
    } catch { removeThrew = true; }
    const still = await heldTeam(s.mirror, { key: s.keyAt });
    stayed = !!(still.team && still.team.epoch === 1);
    noNext = world.entries(s.rt).filter(([k, v]) => k.startsWith("blob:") && v && v.epoch === 2 && v.del !== true).length === 0;
    const body = "{\"note\":\"the desk writes at the current key\"}\n";
    const rel = "desks/" + D.keyId + "/quay-note.ec";
    put(desk.mirror, rel, body);
    await settle(desk.ch);
    await s.runner.sync(); await s.runner.idle();
    taken = read(s.mirror, rel) === body;
    try {
      const pendingKeys = typeof K.pendingEpochsOf === "function" ? K.pendingEpochsOf(s.teamsFile) : {};
      const r = await S.publishProject(proj, {
        folder: s.mirror, notes: "After a removal that did not land.", now: "2026-10-19T09:00:00.000Z",
        leadKey: s.keyAt, key: s.keyAt, passphrase: labSecret(s.keyAt), ...LIC,
        teamKeys: K.teamKeysOf(s.teamsFile, s.vault), pendingKeys,
      });
      published = !!(r && r.refused === null && r.ec && fs.existsSync(r.ec));
    } catch (e) { pubWhy = String(e && e.message || e); }
    try {
      const rm = await S.removeMember(proj, s.keyAt, s.teamId, D.keyId, labSecret(s.keyAt), {
        confirm: true, teamKeys: K.teamKeysOf(s.teamsFile, s.vault), nextKey, nextEpoch: 2, teamsFile: s.teamsFile,
      });
      const again = await heldTeam(s.mirror, { key: s.keyAt });
      retried = !!(rm && rm.removed === D.keyId && again.team && again.team.epoch === 2
        && rm.teamKey && Buffer.from(rm.teamKey).equals(nextKey));
    } catch (e) { retryWhy = String(e && e.message || e); }
  } finally {
    try { await desk.ch.stop(); } catch { /* the desk is already down */ }
    try { await s.runner.stop(); } catch { /* the runner is already down */ }
  }

  /* The shell's own handler: a throw after the key is kept leaves it pending, and the retry clears that once the
     team write lands, keeping the same key. */
  const labS = labDir("relay-rs920-shell"), ud = path.join(labS, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const teamsFile = K.teamsFile(ud), vault = shellVault(), teamId = "t-" + hex(8), member = deskKeys().keyId;
  K.keepTeamKey(teamsFile, vault, teamId, 1, crypto.randomBytes(32));
  fs.mkdirSync(K.keepRelay(teamsFile, teamId, Relay.relayId(), Relay.RELAY_URL), { recursive: true });
  let tried = false, handed = null;
  const shell = await loadStudioShell(ud, { thread: (verb, ...args) => {
    if (verb === "teamFacts") return { team: { id: teamId, epoch: 1, roster: [{ id: member }] }, file: "share" };
    if (verb === "removeMember") {
      const o = args[5] || {};
      const key = o.nextKey ? Buffer.from(o.nextKey) : null;
      if (!tried) { tried = true; handed = key; throw new Error("the share refused the write"); }
      return { removed: member, team: { id: teamId, epoch: 2, roster: [] },
        written: { id: teamId, epoch: 2, roster: [] }, teamKey: key || Buffer.alloc(32, 7), epoch: 2 };
    }
    return {};
  } });
  let marked = false, cleared = false, shellWhy = "";
  const shellProj = path.join(ud, "Etiuda Studio", "project");
  try {
    const first = await shell.ask("studio:member-remove", shellProj, teamId, member, true);
    const midKey = (K.teamKeysOf(teamsFile, vault)[teamId] || {})[2];
    marked = !!(shell.win && first && first.error && Buffer.isBuffer(midKey) && handed && midKey.equals(handed)
      && pendingOf(teamsFile, teamId).indexOf(2) >= 0);
    const second = await shell.ask("studio:member-remove", shellProj, teamId, member, true);
    const afterKey = (K.teamKeysOf(teamsFile, vault)[teamId] || {})[2];
    cleared = !!(second && second.error === null && second.removed === member && Buffer.isBuffer(afterKey)
      && handed && afterKey.equals(handed) && pendingOf(teamsFile, teamId).indexOf(2) < 0);
    shellWhy = "pending " + JSON.stringify(pendingOf(teamsFile, teamId));
  } finally { shell.done(); }

  check(removeThrew && stayed && noNext && taken && published && retried && marked && cleared,
    "rs920 a failed removal keeps the next key pending: no blob at epoch 2 " + noNext + ", the desk's upload at epoch 1 taken "
    + taken + ", a sealed publish writes " + published + (pubWhy ? " (" + pubWhy.slice(0, 140) + ")" : "")
    + ", the removal retried at epoch 2 with the same key " + retried + (retryWhy ? " (" + retryWhy.slice(0, 120) + ")" : "")
    + "; the shell marks the key pending when the write throws " + marked + " and clears it when the write lands " + cleared
    + " (threw " + removeThrew + ", team file stayed " + stayed + ", " + shellWhy + ")");
};

LEGS.rs920b = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs920b");
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true });
  const S = await import("../src/studio.mjs");
  const proj = (await S.newProject(path.join(lab, "projects"), "Quay lamps", [{ code: "en", name: "English" }])).dir;
  const shelf = (await S.addTag(proj, "shelf", { en: "General" })).tag.id;
  await S.addCard(proj, shelf, "Quay lamp", "A quay lamp, lit at dusk.");
  S.setPublishFolder(proj, s.mirror);
  await S.setTeamSealed(proj, true, { key: s.keyAt, passphrase: labSecret(s.keyAt), teamId: s.teamId, /* the relay team studioLead made, sealed by the verb (it writes a team on the relay) */
    teamKeys: K.teamKeysOf(s.teamsFile, s.vault) });
  await s.runner.sync(); await s.runner.idle();
  const desk = deskOf(world, lab, s, "desk", D, new Map([[1, s.teamKey]]));
  desk.ch.start();
  await settle(desk.ch);

  const pendingOf = (file, team) => (typeof K.pendingEpochsOf === "function" ? (K.pendingEpochsOf(file)[team] || []) : []);
  const oldTeamJson = fs.readFileSync(teamPath(s.mirror), "utf8");

  const nextKey = crypto.randomBytes(32);
  K.keepTeamKey(s.teamsFile, s.vault, s.teamId, 2, nextKey);
  await S.removeMember(proj, s.keyAt, s.teamId, D.keyId, labSecret(s.keyAt), {
    confirm: true, teamKeys: K.teamKeysOf(s.teamsFile, s.vault), nextKey, nextEpoch: 2, teamsFile: s.teamsFile,
  });
  K.markKeyPending(s.teamsFile, s.teamId, 2);
  const markWasLeft = pendingOf(s.teamsFile, s.teamId).indexOf(2) >= 0;

  await s.runner.sync(); await s.runner.idle();
  const markCleared = pendingOf(s.teamsFile, s.teamId).indexOf(2) < 0;

  fs.writeFileSync(teamPath(s.mirror), oldTeamJson);
  const revsAt = path.join(s.ud, "team-revs.json");
  if (fs.existsSync(revsAt)) fs.unlinkSync(revsAt);

  let rollbackRefused = false, pubWhy = "";
  try {
    const pendingKeys = typeof K.pendingEpochsOf === "function" ? K.pendingEpochsOf(s.teamsFile) : {};
    await S.publishProject(proj, {
      folder: s.mirror, notes: "After rollback attempt.", now: "2026-10-19T09:00:00.000Z",
      leadKey: s.keyAt, key: s.keyAt, passphrase: labSecret(s.keyAt), ...LIC,
      teamKeys: K.teamKeysOf(s.teamsFile, s.vault), pendingKeys, teamsFile: s.teamsFile,
    });
  } catch (e) {
    rollbackRefused = /is older than a team key this Studio holds/.test(String(e && e.message || e));
    pubWhy = String(e && e.message || e);
  } finally {
    try { await desk.ch.stop(); } catch { /* down */ }
    try { await s.runner.stop(); } catch { /* down */ }
  }

  const markGone = pendingOf(s.teamsFile, s.teamId).indexOf(2) < 0;
    check(markWasLeft && markCleared && rollbackRefused && markGone,
    "rs920b a stale pending mark is cleared when Studio reads its own team file: marked " + markWasLeft
    + ", cleared by sync " + markCleared + ", rollback refused " + rollbackRefused
    + (pubWhy ? " (" + pubWhy.slice(0, 300) + ")" : "") + ", mark gone " + markGone);
};

/* Board 974, C2 on the relay (the test architect's E2 on 586d4a2b): a removal whose write of the sealed edition in the mirror
   is refused EBUSY after the team file landed, then one look of the watch, which calls the thread's resealBehind on the mirror
   and ends with the sync. The mirror's edition is at key number 2 after the look, and the sync hands the relay that edition
   sealed at key number 2: a blob at epoch 2 that opens under the kept key to the edition's own path. */
LEGS.rsC2 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsC2");
  const D1 = deskKeys(), D2 = deskKeys();
  const s = await studioLead(world, lab, { roster: [D1, D2], wraps: true });
  const S = await import("../src/studio.mjs");
  const proj = (await S.newProject(path.join(lab, "projects"), "Quay lamps", [{ code: "en", name: "English" }])).dir;
  const shelf = (await S.addTag(proj, "shelf", { en: "General" })).tag.id;
  await S.addCard(proj, shelf, "Quay lamp", "A quay lamp, lit at dusk.");
  S.setPublishFolder(proj, s.mirror);
  await S.setTeamSealed(proj, true, { key: s.keyAt, passphrase: labSecret(s.keyAt), teamId: s.teamId, /* the relay team studioLead made, sealed by the verb (it writes a team on the relay) */
    teamKeys: K.teamKeysOf(s.teamsFile, s.vault) });
  const realOpen = fs.openSync;
  let threw = "", ecName = "", mid = {}, look = null, atTwo = false, reached = false, before = false, why = "";
  try {
    const pub = await S.publishProject(proj, { folder: s.mirror, notes: "Edition one.", now: "2026-10-19T09:00:00.000Z",
      leadKey: s.keyAt, key: s.keyAt, passphrase: labSecret(s.keyAt), teamKeys: K.teamKeysOf(s.teamsFile, s.vault), ...LIC });
    ecName = path.basename(String(pub && pub.ec || ""));
    await s.runner.sync(); await s.runner.idle();
    const nextKey = crypto.randomBytes(32);
    K.keepTeamKey(s.teamsFile, s.vault, s.teamId, 2, nextKey);
    const prefix = path.join(s.mirror, ecName) + ".";
    fs.openSync = function (p, ...a) {
      if (typeof p === "string" && p.startsWith(prefix) && /\.tmp$/i.test(p)) {
        const err = new Error("EBUSY: resource busy or locked, open '" + p + "'");
        err.code = "EBUSY";
        throw err;
      }
      return realOpen.call(this, p, ...a);
    };
    try {
      await S.removeMember(proj, s.keyAt, s.teamId, D1.keyId, labSecret(s.keyAt), { confirm: true, teamKeys: K.teamKeysOf(s.teamsFile, s.vault),
        nextKey, nextEpoch: 2, teamsFile: s.teamsFile });
    } catch (e) { threw = String(e && (e.code || e.message) || e); }
    finally { fs.openSync = realOpen; }
    const envNow = () => { try { return JSON.parse(read(s.mirror, ecName)); } catch { return {}; } };
    const held = await heldTeam(s.mirror, { key: s.keyAt });
    mid = { team: held.team && held.team.epoch, ec: envNow().epoch };
    const blobsAt = (epoch) => world.entries(s.rt).filter(([k, v]) => k.startsWith("blob:") && v && v.epoch === epoch && v.del !== true)
      .map(([, v]) => v);
    const edition = (v) => {
      const raw = world.R.bucket.objects.get(v.obj);
      const f = raw ? opensWith(world, s.rt, nextKey, v, Buffer.from(raw)) : null;
      return !!f && f.kind === "file" && f.path === ecName;
    };
    before = !blobsAt(2).some(edition);
    /* The watch's look: the verb it calls, then the sync it ends with. */
    look = typeof S.resealBehind === "function"
      ? await S.resealBehind(s.mirror, s.keyAt, { teamKeys: K.teamKeysOf(s.teamsFile, s.vault) }) : null;
    atTwo = envNow().epoch === 2;
    await s.runner.sync(); await s.runner.idle();
    reached = blobsAt(2).some(edition);
  } catch (e) { why = String(e && e.message || e); }
  finally {
    fs.openSync = realOpen;
    try { await s.runner.stop(); } catch { /* the runner is already down */ }
  }
  check(/EBUSY/.test(threw) && mid.team === 2 && mid.ec === 1 && before && !!look && atTwo && reached,
    "rsC2 a removal whose edition write is refused after the team file landed, then one look: the mirror's edition is at key"
    + " number 2 and the relay is handed it at epoch 2 (refused " + threw.slice(0, 40) + ", team " + mid.team + ", edition " + mid.ec
    + " before the look, none at epoch 2 on the relay before it " + before + "; after the look at 2 " + atTwo + ", on the relay "
    + reached + (why ? "; " + why.slice(0, 160) : "") + ")");
};

LEGS.rs923c5 = async () => {
  const lab = labDir("relay-rs923c5"), ud = path.join(lab, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const file = K.teamsFile(ud), team = "t-" + hex(8);
  const desk = { id: "k-" + hex(8), key: hex(32) };
  const files1 = { ["desks/" + desk.id + "/stats.estat"]: sha(Buffer.from("tenure 1")) };
  const at1 = 1000;
  const r1 = K.markRemoved(file, team, desk, at1, 2, files1);
  const rec1 = (K.removedOf(file, team) || {})[desk.id] || null;

  const key2 = hex(32), files2 = { ["desks/" + desk.id + "/stats.estat"]: sha(Buffer.from("tenure 2")), ["desks/" + desk.id + "/extra.ec"]: sha(Buffer.from("extra 2")) };
  const at2 = 2000;
  const r2 = K.markRemoved(file, team, { id: desk.id, key: key2 }, at2, 4, files2);
  const rec2 = (K.removedOf(file, team) || {})[desk.id] || null;

  const key3 = hex(32), files3 = { ["desks/" + desk.id + "/stats.estat"]: sha(Buffer.from("stale tenure")) };
  const at3 = 3000;
  const r3 = K.markRemoved(file, team, { id: desk.id, key: key3 }, at3, 3, files3);
  const rec3 = (K.removedOf(file, team) || {})[desk.id] || null;

  const epoch2Record = !!rec1 && rec1.epoch === 2 && rec1.key === desk.key && rec1.at === at1
    && JSON.stringify(rec1.files) === JSON.stringify(files1);
  const epoch4Record = r2 === true && !!rec2 && rec2.epoch === 4 && rec2.key === key2 && rec2.at === at2
    && JSON.stringify(rec2.files) === JSON.stringify(files2);
  const staleIgnored = r3 === false && !!rec3 && rec3.epoch === 4 && rec3.key === key2 && rec3.at === at2
    && JSON.stringify(rec3.files) === JSON.stringify(files2);

  check(r1 === true && epoch2Record && epoch4Record && staleIgnored,
    "rs923c5 a second removal of a re-admitted desk keeps the record of its second tenure: first " + r1
    + ", second " + r2 + ", epoch 4 record " + epoch4Record + ", stale epoch 3 refused " + (r3 === false)
    + ", record kept " + staleIgnored);
};

/* ---- board 935, G2 on Studio's side: a later grant renewed at the relay, and where the team stands ------------------------- */

const G2_DAY = 24 * 60 * 60 * 1000;
/* A lead on the lab's relay whose two clocks, Studio's and the relay's, a leg moves together with `at`. `row` is the relay's own team
   row, `standing` where the pinned lapseOf stands it at the relay's clock, `kept` the runner's record of the team, `grantPosts` each
   body Studio posted to the team's grant route. */
async function g2Lead(name, grantOpts) {
  const world = await relayWorld(), T0 = Date.now(), lab = labDir("relay-" + name), said = [];
  world.R.clock.now = T0;
  const s = await studioLead(world, lab, { grantOpts, say: (l) => said.push(l) });
  s.setClock(T0);
  const at = (ms) => { world.R.clock.now = ms; s.setClock(ms); };
  const sync = async () => { await s.runner.sync(); await s.runner.idle(); };
  const row = () => (world.store(s.rt) ? world.store(s.rt).get("team") : null);
  const standing = () => { const r = row(); return r ? world.core.lapseOf(r, world.R.clock.now).state : "none"; };
  const kept = () => K.relayTeams(s.teamsFile).find((w) => w.team === s.teamId) || null;
  const grantPosts = () => s.t.sent.filter((l) => /^POST https:\/\/etiuda\.dev\/relay\/v1\/t\/[0-9a-f]{32}\/grant\n/.test(l))
    .map((l) => { try { return JSON.parse(l.slice(l.lastIndexOf("\n") + 1)); } catch { return null; } });
  return { world, T0, lab, said, s, at, sync, row, standing, kept, grantPosts };
}
/* The lead's own session at the relay's clock, opened as src/relay.mjs leadSession opens it: its status and the lapse it is told. */
async function g2Session(L) {
  const t = L.world.transport("probe-" + hex(2)), base = Relay.RELAY_URL + "/t/" + L.s.rt, json = { "content-type": "application/json" };
  const h = await t.request("POST", base + "/hello", json, Buffer.from("{}"));
  let ch = "";
  try { ch = JSON.parse(Buffer.from(h.bytes).toString("utf8")).challenge; } catch { ch = ""; }
  const open = unlockKey(readKeyFile(L.s.keyAt), labSecret(L.s.keyAt));
  const body = { challenge: ch, key: open.keyId, pub: open.public, sig: crypto.sign(null, L.world.core.helloBytes(L.s.rt, ch, open.keyId), open.privateKey).toString("hex") };
  const r = await t.request("POST", base + "/session", json, Buffer.from(JSON.stringify(body)));
  let j = null;
  try { j = JSON.parse(Buffer.from(r.bytes).toString("utf8")); } catch { j = null; }
  return { status: r.status, lapse: j && j.lapse ? j.lapse : null, error: j && j.error ? j.error : null };
}
const g2Line = (ok) => Object.keys(ok).map((k) => k + " " + ok[k]).join(", ");

/* The lead's hello, as leadSession sends it, carries the lead's public half beside the key id. */
LEGS.rsPub = async () => {
  const world = await relayWorld(), lab = labDir("relay-rspub");
  const s = await studioLead(world, lab, {});
  await s.runner.sync();
  await s.runner.heardState(s.teamId, "00".repeat(16));
  const bodies = [];
  for (const line of s.t.sent) {
    if (line.indexOf("POST ") !== 0 || line.indexOf("/session") < 0) continue;
    const at = line.lastIndexOf("\n{");
    if (at < 0) continue;
    try { bodies.push(JSON.parse(line.slice(at + 1))); } catch { bodies.push(null); }
  }
  const open = unlockKey(readKeyFile(s.keyAt), labSecret(s.keyAt));
  const carried = bodies.some((b) => b && b.pub === open.public && b.key === open.keyId && /^[0-9a-f]{128}$/.test(String(b.sig)));
  check(carried, "rsPub the lead's hello carries the lead's public half: " + JSON.stringify(bodies.map((b) => b && { key: b.key, pub: b.pub })));
  await s.runner.stop();
};

/* A trial's team whose lead buys: the quiet check keeps the paid grant beside the key (as src/licence-client.mjs take writes it), the
   next sync posts it to the team's grant route, and past the trial's end the team still works: the relay's own row holds the paid end,
   the pinned lapseOf stands it working, the lead's session is answered, and the runner keeps the relay's word that it works. */
LEGS.g2s1 = async () => {
  const L = await g2Lead("g2s1", { fields: { paid: false, until: Date.now() + 14 * G2_DAY } });
  await L.sync();
  const trial = !!L.row() && L.row().paid === false && L.row().until === L.s.grant.until;
  L.at(L.T0 + 3 * G2_DAY);
  const bought = granted(L.s.keyAt, L.s.lead.public, L.T0 + 3 * G2_DAY);
  await L.sync();
  L.at(L.T0 + 20 * G2_DAY);
  await L.sync();
  const r = L.row(), ses = await g2Session(L), k = L.kept();
  const ok = { trialMade: trial, relayHoldsPaid: !!r && r.until === bought.until && r.paid === true, workingAtDay20: L.standing() === "working",
    sessionAnswered: ses.status === 200, toldWorking: !!k && !!k.lapse && k.lapse.state === "working" && k.lapse.until === bought.until };
  await L.s.runner.stop();
  check(Object.values(ok).every((v) => v === true),
    "g2s1 a trial's team that buys works past the trial's end (day 14): the bought grant is posted at the next sync and at day 20 " + g2Line(ok)
    + "; the relay's row " + JSON.stringify(r && { until: r.until, paid: r.paid }) + ", session " + ses.status + (ses.error ? " " + ses.error : ""));
};

/* A paid team the quiet check keeps renewed never turns read-only: a new paid grant kept every 25 days goes to the relay at the next
   sync, and at days 25, 50, 75 and 100, long past the first grant's read-only time (day 60), the team works and the lead's session is
   answered. */
LEGS.g2s2 = async () => {
  const L = await g2Lead("g2s2");
  await L.sync();
  const seen = [];
  let last = L.s.grant;
  for (const day of [25, 50, 75, 100]) {
    L.at(L.T0 + day * G2_DAY);
    if (day < 100) last = granted(L.s.keyAt, L.s.lead.public, L.T0 + day * G2_DAY);
    await L.sync();
    seen.push({ day, state: L.standing(), session: (await g2Session(L)).status });
  }
  const ok = { everWorking: seen.every((x) => x.state === "working" && x.session === 200), relayHoldsLast: !!L.row() && L.row().until === last.until,
    posts: L.grantPosts().length === 3 };
  await L.s.runner.stop();
  check(Object.values(ok).every((v) => v === true),
    "g2s2 a paid team kept renewed by the quiet check never turns read-only: " + g2Line(ok) + "; " + seen.map((x) => "day " + x.day + " " + x.state + " " + x.session).join(", "));
};

/* A held grant later than the relay was last told is posted at the next sync, the body the grant alone, and the answer's lapse is
   where the team then stands (the relay answering no session and no since meanwhile, so that word is the answer's alone); nothing is posted again while nothing is owed; a told lapse that ends earlier than the held grant is
   owed again; and a team made before the last grant was kept (no record of it) is posted once. */
LEGS.g2s3 = async () => {
  const L = await g2Lead("g2s3");
  await L.sync();
  const g1 = L.s.grant, k0 = L.kept();
  const ok = { createKept: !!k0 && !!k0.granted && k0.granted.until === g1.until && k0.granted.paid === true, noPostAtCreate: L.grantPosts().length === 0 };
  /* From here the relay answers no session and no since, so the only word Studio can take is the grant route's answer. */
  L.s.t.answer = async (method, url) => (/\/(session|since\/\d+)$/.test(String(url)) ? { status: 503, bytes: Buffer.from("{}"), header: () => null } : null);
  L.at(L.T0 + G2_DAY);
  const g2 = granted(L.s.keyAt, L.s.lead.public, L.T0 + G2_DAY);
  await L.sync();
  const posts = L.grantPosts(), k1 = L.kept(), told = L.world.core.lapseOf(L.row(), L.world.R.clock.now);
  ok.onePost = posts.length === 1;
  ok.bodyIsTheGrant = !!posts[0] && Object.keys(posts[0]).join() === "grant" && JSON.stringify(posts[0].grant) === JSON.stringify(g2);
  ok.relayHolds = L.row().until === g2.until;
  ok.lapseTaken = !!k1.lapse && k1.lapse.state === told.state && k1.lapse.until === told.until && k1.lapse.readOnly === told.readOnly
    && k1.lapse.swept === told.swept && k1.lapse.until === g2.until;
  ok.grantedKept = !!k1.granted && k1.granted.until === g2.until;
  await L.sync();
  ok.notAgain = L.grantPosts().length === 1;
  K.markRelay(L.s.teamsFile, L.s.teamId, { lapse: Object.assign({}, k1.lapse, { until: g2.until - G2_DAY }) });
  await L.sync();
  ok.toldEarlierOwed = L.grantPosts().length === 2 && L.kept().lapse.until === g2.until;
  K.markRelay(L.s.teamsFile, L.s.teamId, { granted: null, lapse: null });
  await L.sync();
  ok.unrecordedOwedOnce = L.grantPosts().length === 3 && !!L.kept().granted && L.kept().granted.until === g2.until;
  await L.sync();
  ok.thenQuiet = L.grantPosts().length === 3;
  await L.s.runner.stop();
  check(Object.values(ok).every((v) => v === true),
    "g2s3 a held grant later than the relay was last told is posted at the next sync and the told lapse taken: " + g2Line(ok));
};

/* A post the relay refuses changes nothing: with the relay's clock past the held grant's end (it answers bad-grant), the relay's row is
   byte for byte as it was, the runner keeps the grant it had and no lapse from that answer, the refusal is said as the relay's other
   refusals are (the runner's say, "relay of team <id>: " and the relay's own sentence), and the next sync posts the grant again. */
LEGS.g2s4 = async () => {
  const L = await g2Lead("g2s4");
  await L.sync();
  const g1 = L.s.grant;
  L.s.setClock(L.T0 + 5 * G2_DAY);
  granted(L.s.keyAt, L.s.lead.public, L.T0 + 5 * G2_DAY);
  L.world.R.clock.now = L.T0 + 36 * G2_DAY;
  const rowBefore = JSON.stringify(L.row()), grantedBefore = JSON.stringify(L.kept().granted);
  L.said.length = 0;
  await L.sync();
  const k = L.kept(), badGrant = L.world.B.REASONS["bad-grant"];
  const ok = { posted: L.grantPosts().length === 1, relayRowUnchanged: JSON.stringify(L.row()) === rowBefore,
    grantedUnchanged: JSON.stringify(k.granted) === grantedBefore && !!k.granted && k.granted.until === g1.until,
    noLapseFromIt: !k.lapse || k.lapse.until === g1.until,
    said: L.said.some((l) => l.indexOf("relay of team " + L.s.teamId + ": ") === 0 && l.indexOf(badGrant) >= 0) };
  await L.sync();
  ok.postedAgain = L.grantPosts().length === 2 && JSON.stringify(L.row()) === rowBefore;
  await L.s.runner.stop();
  check(Object.values(ok).every((v) => v === true),
    "g2s4 a grant post the relay refuses changes nothing and is said: " + g2Line(ok) + "; said " + JSON.stringify(L.said.filter((l) => l.indexOf(badGrant) >= 0).slice(0, 1)));
};

/* The relay's word reaches the lead with no grant posted: a paid team past its read-only time (day 70) is told read-only on its session
   and on since's etiuda-lapse header, and the runner keeps that, the relay's own instants, and stands it read-only. */
LEGS.g2s8 = async () => {
  const L = await g2Lead("g2s8");
  await L.sync();
  L.at(L.T0 + 70 * G2_DAY);
  await L.sync();
  const k = L.kept(), told = L.world.core.lapseOf(L.row(), L.world.R.clock.now), step = Relay.lapseStep(k && k.lapse, L.world.R.clock.now);
  const ok = { noPost: L.grantPosts().length === 0, keptReadOnly: !!k && !!k.lapse && k.lapse.state === "read-only",
    relaysInstants: !!k && !!k.lapse && k.lapse.until === told.until && k.lapse.readOnly === told.readOnly && k.lapse.swept === told.swept,
    stood: !!step && step.step === "read-only" };
  await L.s.runner.stop();
  check(Object.values(ok).every((v) => v === true), "g2s8 the relay's word on a session and on since is kept with no grant posted: " + g2Line(ok));
};

/* Board 987: a lapse never gates an act that lets a person go. A paid team past its read-only time (day 70) holds a registered
   invitation the lead has since withdrawn, and a new one. The sync sends the drop in a call of its own, which the relay takes, and the
   add in another, which it refuses team-lapsed; the lead is told that in the relay's own words. Renewed, the next sync registers the
   add and does not send the drop again. */
LEGS.rs987 = async () => {
  const L = await g2Lead("rs987");
  const s = L.s, world = L.world, rows = () => world.store(s.rt);
  const target = { team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } };
  const invite = (name, at) => {
    const secret = newSecret(), ri = Relay.relayInvite(secret);
    const made = makeInvite(target, name, secret, at, undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
    K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
    return { made, ri };
  };
  const a = invite("Nera Quay", L.T0);
  await L.sync();
  const registered = !!rows().get("inv:" + a.ri.inv);
  L.at(L.T0 + 70 * G2_DAY);
  K.endInvite(s.teamsFile, s.teamId, a.made.id, "withdrawn");
  const b = invite("Olin Marsh", L.T0 + 70 * G2_DAY);
  const before = invitePosts(s.t).length;
  const res = await s.runner.sync(); await s.runner.idle();
  const lapsed = invitePosts(s.t).slice(before).map((p) => ({ add: ((p && p.add) || []).map((x) => x.id), drop: (p && p.drop) || [] }));
  const lapsedSaid = "relay of team " + s.teamId + ": " + world.B.REASONS["team-lapsed"];
  const ok = { registered, readOnly: L.standing() === "read-only",
    twoCalls: JSON.stringify(lapsed) === JSON.stringify([{ add: [], drop: [a.ri.inv] }, { add: [b.ri.inv], drop: [] }]),
    dropTaken: !rows().get("inv:" + a.ri.inv), addRefused: !rows().get("inv:" + b.ri.inv),
    toldLapsed: !!res[0] && res[0].ok === false && res[0].reason === "team-lapsed" && L.said.indexOf(lapsedSaid) >= 0 };
  granted(s.keyAt, s.lead.public, L.T0 + 70 * G2_DAY);
  const after = invitePosts(s.t).length;
  await L.sync();
  const renewed = invitePosts(s.t).slice(after);
  ok.addAfterRenewal = L.standing() === "working" && !!rows().get("inv:" + b.ri.inv);
  ok.dropNotAgain = renewed.length > 0 && renewed.every((p) => !p || !(p.drop || []).length);
  await s.runner.stop();
  check(Object.values(ok).every((v) => v === true), "rs987 a team past its grant takes the drop of a withdrawn invitation in a call of its own and refuses the add"
    + " beside it team-lapsed, said in the relay's words; renewed, the add is registered and the drop not sent again: " + g2Line(ok)
    + "; calls while read-only " + JSON.stringify(lapsed.map((p) => ({ add: p.add.length, drop: p.drop.length }))) + ", answered "
    + JSON.stringify((res || []).map((r) => r.reason || "ok")));
};

/* Board 974, the lapsed-trial removal end to end (λ′'s leg gap of 2026-11-12, beside rs11's removeMember). A trial's team with two
   desks enrolled lapses (day 20 of a 14-day trial). The lead takes one desk off by Studio's own removeMember, the shell's marks after
   it, and Studio's sync carries the removal to the relay, which takes a list that only removes even in a lapsed trial: the desk's
   key is off and recorded gone while the other stays. Renewed, the next sync lands the moved team file, and a hello by the removed
   desk is answered removed while the one that stayed is answered a session. */
LEGS.rs974lt = async () => {
  const S = await import("../src/studio.mjs");
  const world = await relayWorld(), T0 = Date.now(), lab = labDir("relay-rs974lt"), said = [];
  world.R.clock.now = T0;
  const D1 = deskKeys(), D2 = deskKeys();
  const s = await studioLead(world, lab, { roster: [D1, D2], wraps: true, grantOpts: { fields: { paid: false, until: T0 + 14 * G2_DAY } },
    say: (l) => said.push(l) });
  s.setClock(T0);
  const at = (ms) => { world.R.clock.now = ms; s.setClock(ms); };
  const sync = async () => { const r = await s.runner.sync(); await s.runner.idle(); return r; };
  const rows = () => world.store(s.rt);
  const standing = () => world.core.lapseOf(rows().get("team"), world.R.clock.now).state;
  const hello = async (D) => {
    const t = world.transport("probe-" + hex(2)), base = Relay.RELAY_URL + "/t/" + s.rt, json = { "content-type": "application/json" };
    const h = await t.request("POST", base + "/hello", json, Buffer.from("{}"));
    let ch = "";
    try { ch = JSON.parse(Buffer.from(h.bytes).toString("utf8")).challenge; } catch { ch = ""; }
    const body = { challenge: ch, key: D.keyId, pub: D.pub, sig: crypto.sign(null, world.core.helloBytes(s.rt, ch, D.keyId), D.privateKey).toString("hex"),
      seat: deskCert(D.pub, world.R.clock.now) };
    const r = await t.request("POST", base + "/session", json, Buffer.from(JSON.stringify(body)));
    let j = null;
    try { j = JSON.parse(Buffer.from(r.bytes).toString("utf8")); } catch { j = null; }
    return r.status === 200 ? "session" : String(j && j.error || r.status);
  };
  const proj = (await S.newProject(path.join(lab, "projects"), "Harbour lamps", [{ code: "en", name: "English" }])).dir;
  S.setPublishFolder(proj, s.mirror);
  const ok = {};
  let rm = null, res = null, sessions = {};
  try {
    await sync();
    ok.enrolled = !!rows() && !!rows().get("dev:" + D1.keyId) && !!rows().get("dev:" + D2.keyId);
    at(T0 + 20 * G2_DAY);
    await sync();
    ok.lapsedTrial = !!rows().get("team") && rows().get("team").paid === false && standing() === "lapsed";
    rm = await S.removeMember(proj, s.keyAt, s.teamId, D1.keyId, labSecret(s.keyAt), { confirm: true, teamKeys: K.teamKeysOf(s.teamsFile, s.vault),
      invites: K.inviteBookOf(s.teamsFile, s.vault), teamsFile: s.teamsFile });
    if (rm.endedInvite) K.endInvite(s.teamsFile, s.teamId, rm.endedInvite, "spent", rm.removed);
    K.keepTeamKey(s.teamsFile, s.vault, s.teamId, rm.team.epoch, Buffer.from(rm.teamKey));
    ok.removedHere = rm.removed === D1.keyId && rm.team.epoch === 2;
    res = await sync();
    ok.offAtRelay = !rows().get("dev:" + D1.keyId) && !!rows().get("gone:" + D1.keyId) && !!rows().get("dev:" + D2.keyId);
    ok.stillLapsed = standing() === "lapsed";
    granted(s.keyAt, s.lead.public, T0 + 20 * G2_DAY);
    await sync();
    await sync();
    ok.renewed = standing() === "working";
    ok.movedFileLanded = world.entries(s.rt).some(([k, v]) => k.startsWith("blob:") && v && v.epoch === 2 && v.del !== true);
    sessions = { removed: await hello(D1), stayed: await hello(D2) };
    ok.removedTold = sessions.removed === "removed";
    ok.stayedAnswered = sessions.stayed === "session";
  } finally { await s.runner.stop(); }
  check(Object.keys(ok).length === 9 && Object.values(ok).every((v) => v === true), "rs974lt a lapsed trial's lead takes a desk off by Studio's"
    + " removeMember and the sync carries it to the relay: the key is off and recorded gone, the other stays; renewed, the moved team file"
    + " lands, the removed desk is told removed and the other answered: " + g2Line(ok) + "; the lapsed sync answered "
    + JSON.stringify((res || []).map((r) => r.reason || "ok")) + ", hellos " + JSON.stringify(sessions)
    + (said.length ? " (" + said.slice(-2).join(" | ").slice(0, 300) + ")" : ""));
};

/* Every file under each folder, by relative path. */
function g2Files(dirs) {
  const out = [];
  for (const d of dirs) Object.keys(treeOf(d)).forEach((k) => out.push(d + "|" + k));
  return out;
}
/* Each step of a team's lapse is given to the lead once, with its dates, through the shell's own handler: the team made through the
   shell (studio:team-relay), its held grant long ended so nothing is owed, and the relay's row moved as time moves it; the relay tells
   grace and read-only on its own answers, and the trial's lapse and the sweep are read from what it told while the team worked (a lapsed
   team is answered no session). studio:relay-lapse hands each step over once, with the names of the projects publishing through the team
   and the step's days; asked again, and after the next sync, it hands nothing; the Licence cover and the team's Desks screen still carry
   the step; the shell tells the page a step is due; and no file in the mirror or the project is removed by any step. */
LEGS.g2s5 = async () => {
  const world = await relayWorld(), lab = labDir("relay-g2s5"), R = await leadAtRest(lab, "Lantern Quay");
  world.R.clock.now = Date.now();
  const t = world.transport("shell");
  const thread = async (verb, ...a) => (verb === "listProjects" ? R.S.listProjects(...a) : R.thread(verb, ...a));
  const shell = await loadStudioShell(R.ud, { relay: t, env: R.env, thread });
  const nudged = [], steps = [], ok = {};
  const day = (ms) => new Date(ms).toISOString().slice(0, 10);
  try {
    shell.win.webContents.send = (ch) => { nudged.push(ch); };
    await shell.ask("studio:team-relay", R.proj);
    const rec = () => K.relayTeams(R.teamsFile)[0] || null;
    await until(() => !!rec() && !!world.store(rec().rt) && !!world.store(rec().rt).get("team") && !!rec().lapse, 20000);
    const store = world.store(rec().rt), team = rec().team, now0 = Date.now();
    granted(R.keyAt, R.made.public, now0 - 40 * G2_DAY);
    const before = g2Files([rec().folder, R.proj]);
    const moveRelay = (fields) => { const row = Object.assign({}, store.get("team"), fields); delete row.paidUntil; store.put("team", row); };
    const told = async (until0) => { await shell.fire("focus"); return until(() => !!rec().lapse && rec().lapse.until === until0, 20000); };
    /* Fetched twice it is still due (a fetch tells nothing, E1); once the lead dismissed it, it is due no more, nor after the next sync. */
    const twice = async (name, want) => {
      const first = await shell.ask("studio:relay-lapse"), second = await shell.ask("studio:relay-lapse");
      const d = first && first.due && first.due[0];
      if (d) await shell.ask("studio:relay-lapse-seen", [{ team: d.team, key: d.key }]);
      await shell.fire("focus"); await wait(300);
      const third = await shell.ask("studio:relay-lapse");
      steps.push({ name, first: first && first.due ? first.due.length : -1, second: second && second.due ? second.due.length : -1,
        third: third && third.due ? third.due.length : -1, got: d || null });
      return !!d && first.due.length === 1 && d.team === team && d.step === want.step && d.until === want.until && d.readOnly === want.readOnly
        && d.swept === want.swept && JSON.stringify(d.names) === JSON.stringify(["Lantern Quay"])
        && second.due.length === 1 && third.due.length === 0 && third.teams.length === 1 && third.teams[0].step === want.step;
    };
    const g = now0 - 2 * G2_DAY;
    moveRelay({ until: g, paid: true });
    ok.graceTold = await told(g);
    ok.nudged = await until(() => nudged.indexOf("studio:relay-lapse-due") >= 0, 25000);
    ok.grace = await twice("grace", { step: "grace", until: day(g), readOnly: day(g + 30 * G2_DAY), swept: day(g + 90 * G2_DAY) });
    const r = now0 - 40 * G2_DAY;
    moveRelay({ until: r, paid: true });
    ok.readOnlyTold = await told(r);
    ok.readOnly = await twice("read-only", { step: "read-only", until: day(r), readOnly: day(r + 30 * G2_DAY), swept: day(r + 90 * G2_DAY) });
    const lic = await shell.ask("studio:licence"), desks = await shell.ask("studio:desks", R.proj);
    ok.cover = !!lic && Array.isArray(lic.relayTeams) && lic.relayTeams.length === 1 && lic.relayTeams[0].step === "read-only" && lic.relayTeams[0].swept === day(r + 90 * G2_DAY);
    ok.desks = !!desks && !!desks.lapse && desks.lapse.step === "read-only" && desks.lapse.team === team;
    /* A trial's team past its end: the relay answers it no session, so the word is what it told while the team worked. */
    moveRelay({ until: g, paid: false });
    K.markRelay(R.teamsFile, team, { lapse: { state: "working", until: g, readOnly: null, swept: g + 30 * G2_DAY, at: g - G2_DAY } });
    ok.lapsed = await twice("lapsed", { step: "lapsed", until: day(g), readOnly: null, swept: day(g + 30 * G2_DAY) });
    const w = now0 - 45 * G2_DAY;
    K.markRelay(R.teamsFile, team, { lapse: { state: "working", until: w, readOnly: null, swept: w + 30 * G2_DAY, at: w - G2_DAY } });
    ok.gone = await twice("gone", { step: "gone", until: day(w), readOnly: null, swept: day(w + 30 * G2_DAY) });
    const after = new Set(g2Files([rec().folder, R.proj]));
    ok.nothingRemoved = before.length > 0 && before.every((f) => after.has(f));
  } finally {
    shell.done();
  }
  check(Object.keys(ok).length === 10 && Object.values(ok).every((v) => v === true),
    "g2s5 each step of a team's lapse is handed to the lead once with its dates, and not again at the next sync, through the shell: " + g2Line(ok)
    + "; " + steps.map((x) => x.name + " " + x.first + "/" + x.second + "/" + x.third + " " + JSON.stringify(x.got)).join("; "));
};

/* The page's half: each step's sentence, in English and in Polish with the dates as the page writes a day, on the Licence cover (named
   by the team's project), on the team's Desks screen, and in the notice, which opens once for the steps the shell hands over and not when
   it hands none; a notice that arrives while another cover is open waits for that cover to close. */
LEGS.g2s6 = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const rows = [
    { team: "t-0011223344556677", names: ["Lantern Quay"], step: "grace", until: "2026-11-02", readOnly: "2026-12-02", swept: "2027-01-31" },
    { team: "t-0011223344556677", names: ["Lantern Quay"], step: "read-only", until: "2026-11-02", readOnly: "2026-12-02", swept: "2027-01-31" },
    { team: "t-0011223344556677", names: ["Lantern Quay"], step: "lapsed", until: "2026-11-02", readOnly: null, swept: "2026-12-02" },
    { team: "t-0011223344556677", names: [], step: "gone", until: "2026-11-02", readOnly: null, swept: "2026-12-02" },
  ];
  const days = { en: { "2026-11-02": "2 November 2026", "2026-12-02": "2 December 2026", "2027-01-31": "31 January 2027" },
    pl: { "2026-11-02": "2 listopada 2026", "2026-12-02": "2 grudnia 2026", "2027-01-31": "31 stycznia 2027" } };
  /* Claudette's text for each step, whole, as the lead reads it (2026-10-25; step 3 as she rewrote it for a licence's or a trial's end). */
  const WORDS = {
    en: { grace: "This team's relay licence ended on {UNTIL}. Its teammates work as before until {READONLY}; after that they can only read what is on the relay, and on {SWEPT} the relay deletes the team's copy. Nothing on the team's computers or in Studio is ever deleted. A licence is renewed from the Menu, under Settings, then Account.",
      "read-only": "This team's relay licence ended on {UNTIL}, and since {READONLY} the relay is read-only: nothing new passes through it, from Studio or from a teammate, so publishing waits for the renewal. On {SWEPT} the relay deletes the team's copy. Nothing on the team's computers or in Studio is ever deleted. A licence is renewed from the Menu, under Settings, then Account.",
      lapsed: "This team's licence or trial for the relay ended on {UNTIL}, and the relay no longer carries its editions. On {SWEPT} the relay deletes the team's copy. Nothing on the team's computers or in Studio is ever deleted. To keep the team on the relay, this Studio needs a licence: signing in, from the Menu, under Settings, then Account, brings one.",
      gone: "The relay deleted this team's copy on {SWEPT}, after its licence ended. Nothing on the team's computers or in Studio was deleted. Renewing the licence brings the team back: at the next sync Studio puts it on the relay again with its latest edition, and the teammates on the team's list rejoin by themselves. To renew: Menu, then Settings, then Licence." },
    pl: { grace: "Licencja przekaźnika dla tego zespołu wygasła dnia {UNTIL}. Do dnia {READONLY} zespół działa jak dotąd; potem mogą tylko odczytywać to, co jest na przekaźniku, a dnia {SWEPT} przekaźnik usunie kopię zespołu. Z komputerów zespołu i ze Studia nic nie zostanie usunięte. Licencję odnawia się z menu, w Ustawieniach, w części Konto.",
      "read-only": "Licencja przekaźnika dla tego zespołu wygasła dnia {UNTIL}, a od dnia {READONLY} przekaźnik działa tylko do odczytu: nic nowego przez niego nie przechodzi, ani ze Studia, ani od członków zespołu, więc publikacja czeka na odnowienie. Dnia {SWEPT} przekaźnik usunie kopię zespołu. Z komputerów zespołu i ze Studia nic nie zostanie usunięte. Licencję odnawia się z menu, w Ustawieniach, w części Konto.",
      lapsed: "Licencja albo okres próbny przekaźnika dla tego zespołu skończyły się dnia {UNTIL} i przekaźnik nie przenosi już jego wydań. Dnia {SWEPT} przekaźnik usunie kopię zespołu. Z komputerów zespołu i ze Studia nic nie zostanie usunięte. Aby zespół został na przekaźniku, to Studio potrzebuje licencji: daje ją zalogowanie się z menu, w Ustawieniach, w części Konto.",
      gone: "Przekaźnik usunął kopię zespołu dnia {SWEPT}, po wygaśnięciu licencji. Z komputerów zespołu i ze Studia nic nie zostało usunięte. Po odnowieniu licencji zespół wróci sam: przy następnej synchronizacji Studio ponownie umieści go na przekaźniku z najnowszym wydaniem, a członkowie z listy zespołu dołączą sami. Licencję można odnowić z menu, w Ustawieniach, w części Licencja." },
  };
  /* Where the relay told no sweep date, the sentence that holds it alone is left out, and nothing else changes. */
  const SWEPT_ALONE = { en: ["On {SWEPT} the relay deletes the team's copy. ", "The relay deleted this team's copy on {SWEPT}, after its licence ended. "],
    pl: ["Dnia {SWEPT} przekaźnik usunie kopię zespołu. ", "Przekaźnik usunął kopię zespołu dnia {SWEPT}, po wygaśnięciu licencji. "] };
  const bad = [], said = {};
  for (const lang of ["en", "pl"]) {
    for (const step of ["read-only", "lapsed", "gone"]) {
      const P0 = loadPage({ api: {}, uiLang: lang }).page, x = { team: "t-0011223344556677", names: [], step, until: "2026-11-02", readOnly: step === "read-only" ? "2026-12-02" : null, swept: null };
      const want = SWEPT_ALONE[lang].reduce((t, s) => t.replace(s, ""), WORDS[lang][step]).replace(/\{(UNTIL|READONLY)\}/g, (m, k) => days[lang][k === "UNTIL" ? x.until : x.readOnly]);
      const got = P0.lapseSaid ? P0.lapseSaid(x) : "";
      if (got !== want) bad.push(lang + " " + step + " with no sweep date: " + got);
    }
  }
  for (const lang of ["en", "pl"]) {
    for (const x of rows) {
      const answers = [{ due: [x], teams: [x] }, { due: [], teams: [x] }];
      const home = loadPage({ api: { relayLapse: async () => answers.shift() || { due: [], teams: [x] }, licence: async () => ({}) }, uiLang: lang }), P = home.page;
      const line = P.lapseSaid ? P.lapseSaid(x) : "";
      said[lang + " " + x.step] = line;
      const want = [x.until, x.readOnly, x.swept].filter((v) => v).map((v) => days[lang][v]);
      const name = x.names.length ? x.names[0] : (lang === "en" ? "A team on the relay" : "Zespół na przekaźniku");
      const enc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      const wordsOk = line === (WORDS[lang][x.step] || "").replace(/\{(UNTIL|READONLY|SWEPT)\}/g, (m, k) => days[lang][x[{ UNTIL: "until", READONLY: "readOnly", SWEPT: "swept" }[k]]]);
      if (!wordsOk) bad.push(lang + " " + x.step + " words: " + line);
      Object.assign(P.S, { open: { dir: "C:/quay", draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [], project: { rev: 0 },
        counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } }, host: { tour: { offered: true } }, err: null, dkNote: null, q: "" });
      P.S.lic = { licence: { status: "active" }, grant: null, relayTeams: [x] };
      const cover = String(P.licenceCoverHtml());
      if (!(cover.indexOf(enc(line)) >= 0 && cover.indexOf(enc(name)) >= 0)) bad.push(lang + " " + x.step + " licence cover");
      Object.assign(P.S, { screen: "projects", home: "team", teamDir: "C:/quay", cover: null,
        desks: { team: { id: x.team, epoch: 1, relay: true, roster: [], sealed: true }, folder: "C:/ud/relay/0123456789abcdef0123456789abcdef", file: "ours", requests: [], lapse: x } });
      P.paintMain();
      if (home.node("#main").innerHTML.indexOf(enc(line)) < 0) bad.push(lang + " " + x.step + " desks");
      P.S.cover = null;
      await P.relayLapseAsk();
      const opened = P.S.cover === "relay-lapse" && String(P.relayLapseCoverHtml()).indexOf(enc(line)) >= 0;
      P.ACTS["cover-close"]();
      await P.relayLapseAsk();
      if (!(opened && P.S.cover === null)) bad.push(lang + " " + x.step + " notice opened " + opened + ", then " + P.S.cover);
    }
  }
  /* Behind another cover: the notice waits, and opens as that cover closes. */
  const home = loadPage({ api: { relayLapse: async () => ({ due: [rows[1]], teams: [rows[1]] }) }, uiLang: "en" }), P = home.page;
  P.S.cover = "settings";
  await P.relayLapseAsk();
  const waited = P.S.cover === "settings";
  P.ACTS["cover-close"]();
  const thenOpen = P.S.cover === "relay-lapse";
  P.ACTS["cover-close"]();
  if (!(waited && thenOpen && P.S.cover === null)) bad.push("behind a cover: waited " + waited + ", then opened " + thenOpen + ", then " + P.S.cover);
  const plDiffers = ["grace", "read-only", "lapsed", "gone"].every((st) => said["pl " + st] && said["pl " + st] !== said["en " + st]);
  if (!plDiffers) bad.push("a Polish sentence is the English one");
  check(bad.length === 0, "g2s6 each step is said with its dates in English and in Polish on the Licence cover, the Desks screen and a notice that opens once: "
    + (bad.length ? "failing " + JSON.stringify(bad) : "every part holds"));
};

/* A team working inside its grant shows nothing new: the shell lists it nowhere (studio:relay-lapse hands nothing and lists nothing, the
   Licence cover's list is empty, the Desks reply carries no step), and the page's Licence cover and Desks screen are byte for byte what
   they are with no word of the relay's lapse at all, and no notice opens. */
LEGS.g2s7 = async () => {
  const world = await relayWorld(), lab = labDir("relay-g2s7"), R = await leadAtRest(lab, "Lantern Quay");
  world.R.clock.now = Date.now();
  const t = world.transport("shell");
  const thread = async (verb, ...a) => (verb === "listProjects" ? R.S.listProjects(...a) : R.thread(verb, ...a));
  const shell = await loadStudioShell(R.ud, { relay: t, env: R.env, thread });
  const ok = {};
  try {
    await shell.ask("studio:team-relay", R.proj);
    const rec = () => K.relayTeams(R.teamsFile)[0] || null;
    ok.told = await until(() => !!rec() && !!rec().lapse && rec().lapse.state === "working", 20000);
    const r = await shell.ask("studio:relay-lapse"), lic = await shell.ask("studio:licence"), desks = await shell.ask("studio:desks", R.proj);
    ok.shellQuiet = !!r && r.due.length === 0 && r.teams.length === 0 && !!lic && Array.isArray(lic.relayTeams) && lic.relayTeams.length === 0
      && !!desks && desks.lapse === null;
  } finally {
    shell.done();
  }
  const { loadPage } = await import("./page-stand-in.mjs");
  const paintBoth = async (withWord) => {
    const home = loadPage({ api: { relayLapse: async () => ({ due: [], teams: [] }) }, uiLang: "en" }), P = home.page;
    Object.assign(P.S, { open: { dir: "C:/quay", draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [], project: { rev: 0 },
      counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } }, host: { tour: { offered: true } }, err: null, dkNote: null, q: "" });
    P.S.lic = Object.assign({ licence: { status: "active" }, grant: { until: "2026-12-01", paid: true } }, withWord ? { relayTeams: [] } : {});
    const cover = String(P.licenceCoverHtml());
    Object.assign(P.S, { screen: "projects", home: "team", teamDir: "C:/quay", cover: null,
      desks: Object.assign({ team: { id: "t-0011223344556677", epoch: 1, relay: true, roster: [], sealed: true }, folder: "C:/ud/relay/0123456789abcdef0123456789abcdef", file: "ours", requests: [] },
        withWord ? { lapse: null } : {}) });
    P.paintMain();
    const desksHtml = home.node("#main").innerHTML;
    await P.relayLapseAsk();
    return { cover, desksHtml, notice: P.S.cover };
  };
  const plain = await paintBoth(false), worded = await paintBoth(true);
  ok.pageSame = plain.cover === worded.cover && plain.desksHtml === worded.desksHtml && worded.notice === null && worded.cover.indexOf("data-lapse") < 0;
  check(Object.values(ok).every((v) => v === true), "g2s7 a team working inside its grant shows nothing new: " + g2Line(ok));
};


/* E1 of the test architect's verdict: a step counts as told only once the lead has dismissed its notice. A step fetched while another
   cover is open, the notice waiting behind it, and then Studio closed, is shown at the next launch; there, closing the notice tells
   it, so a third launch shows it no more. The page is the real page (the stand-in) over the shell's own handlers. */
LEGS.g2s9 = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const world = await relayWorld(), lab = labDir("relay-g2s9"), R = await leadAtRest(lab, "Lantern Quay");
  world.R.clock.now = Date.now();
  const thread = async (verb, ...a) => (verb === "listProjects" ? R.S.listProjects(...a) : R.thread(verb, ...a));
  const launch = async () => loadStudioShell(R.ud, { relay: world.transport("shell-" + hex(2)), env: R.env, thread });
  const pageOver = (shell) => loadPage({ api: { relayLapse: () => shell.ask("studio:relay-lapse"),
    relayLapseSeen: (seen) => shell.ask("studio:relay-lapse-seen", seen), licence: async () => ({}) }, uiLang: "en" }).page;
  const rec = () => K.relayTeams(R.teamsFile)[0] || null;
  const ok = {};
  let shell = await launch();
  try {
    await shell.ask("studio:team-relay", R.proj);
    await until(() => !!rec() && !!world.store(rec().rt) && !!world.store(rec().rt).get("team") && !!rec().lapse, 20000);
    const store = world.store(rec().rt), r = Date.now() - 40 * G2_DAY;
    granted(R.keyAt, R.made.public, r - G2_DAY);
    store.put("team", Object.assign({}, store.get("team"), { until: r, paid: true }));
    await shell.fire("focus");
    ok.told = await until(() => !!rec().lapse && rec().lapse.until === r, 20000);
    const P = pageOver(shell);
    P.S.cover = "settings";
    await P.relayLapseAsk();
    ok.waitedBehind = P.S.cover === "settings" && (P.S.lapseDue || []).length === 1;
  } finally { shell.done(); }
  shell = await launch();
  try {
    const P = pageOver(shell);
    P.S.cover = null;
    await P.relayLapseAsk();
    ok.shownAtNextLaunch = P.S.cover === "relay-lapse" && String(P.relayLapseCoverHtml()).indexOf("since") >= 0;
    P.ACTS["cover-close"]();
    ok.toldOnClose = await until(async () => (await shell.ask("studio:relay-lapse")).due.length === 0, 25000);
  } finally { shell.done(); }
  shell = await launch();
  try {
    const P = pageOver(shell);
    P.S.cover = null;
    await P.relayLapseAsk();
    ok.notAgain = P.S.cover === null;
  } finally { shell.done(); }
  check(Object.keys(ok).length === 5 && Object.values(ok).every((v) => v === true),
    "g2s9 a step fetched behind an open cover and then Studio closed is shown at the next launch, and told once that notice is closed: " + g2Line(ok));
};

/* E2 (1): the relay renews a team only for the key it was made with. After the key is made again, the new key's grant is posted once,
   refused, said as what it is (the relay keeps the team with the key it was made with) and not posted again while the held grant names
   that key; the old key's backup copy restored, its grant is posted and taken. A refusal for any other reason is posted again (g2s4). */
LEGS.g2s10 = async () => {
  const L = await g2Lead("g2s10");
  await L.sync();
  const oldKey = fs.readFileSync(L.s.keyAt), lead0 = L.s.lead.public;
  const ok = { leadKept: !!L.kept() && L.kept().lead === lead0 };
  const remade = await labLeadKey();
  fs.writeFileSync(L.s.keyAt, JSON.stringify(remade, null, 1) + "\n");
  L.at(L.T0 + G2_DAY);
  granted(L.s.keyAt, remade.public, L.T0 + G2_DAY);
  const rowBefore = JSON.stringify(L.row());
  L.said.length = 0;
  await L.sync();
  ok.postedOnce = L.grantPosts().length === 1 && L.grantPosts()[0].grant.lead === remade.public;
  ok.relayUnchanged = JSON.stringify(L.row()) === rowBefore;
  ok.saidTruly = L.said.some((l) => l === "relay of team " + L.s.teamId + ": " + Relay.OTHER_LEAD_SAID);
  ok.held = L.kept().refusedLead === remade.public;
  await L.sync();
  L.at(L.T0 + 2 * G2_DAY);
  granted(L.s.keyAt, remade.public, L.T0 + 2 * G2_DAY);
  await L.sync();
  ok.notPostedAgain = L.grantPosts().length === 1;
  fs.writeFileSync(L.s.keyAt, oldKey);
  L.at(L.T0 + 3 * G2_DAY);
  const back = granted(L.s.keyAt, lead0, L.T0 + 3 * G2_DAY);
  await L.sync();
  ok.restoredPosted = L.grantPosts().length === 2 && !!L.row() && L.row().until === back.until && L.kept().refusedLead === "";
  await L.s.runner.stop();
  check(Object.values(ok).every((v) => v === true),
    "g2s10 a grant the relay refuses as another lead's (the key made again) is posted once, said truly and held until the held grant names another key: " + g2Line(ok));
};

/* E2 (2): the Licence cover says what is so after a key made again, in English and in Polish: the licence follows the new key, and a
   team on the relay stays with the key it was made with, kept by restoring that key's backup copy or made again; the old claim that
   the relay comes to the new key is gone. */
LEGS.g2s11 = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const bad = [];
  /* Claudette's sentence whole, as the cover escapes it. */
  const want = { en: ["This Studio&#39;s signing key has changed since its licence was issued. Signing in again moves the licence to the new key: Use another account, under Account, signs in afresh, with the same account or another. A team on the relay stays with the key it was made with until it is handed to the new one on the Team screen, which needs the old key; without it, restore that key&#39;s backup copy from the Menu, under Settings, then Signing key, or make the team again and invite its teammates anew."], pl: ["Klucz podpisu tego Studia zmienił się od wydania jego licencji. Ponowne zalogowanie się przeniesie licencję na nowy klucz: Użyj innego konta, w części Konto, loguje od nowa, tym samym kontem albo innym. Zespół na przekaźniku zostaje jednak przy kluczu, z którym go utworzono, dopóki nie zostanie przekazany nowemu kluczowi na ekranie Zespół, do czego potrzebny jest stary klucz. Bez niego trzeba przywrócić kopię zapasową tamtego klucza z menu, w Ustawieniach, w części Klucz podpisu, albo utworzyć zespół od nowa i ponownie zaprosić członków zespołu."] };
  for (const lang of ["en", "pl"]) {
    const P = loadPage({ api: {}, uiLang: lang }).page;
    P.S.lic = { licence: { status: "active" }, grant: null, by: "email", keyChanged: true, hasKey: true, relayTeams: [] };
    const html = String(P.licenceCoverHtml());
    for (const w of want[lang]) if (html.indexOf(w) < 0) bad.push(lang + " lacks " + w);
    if (/bring the licence and the relay|licencja i przekaźnik przejdą/.test(html)) bad.push(lang + " still says the relay comes to the new key");
  }
  check(bad.length === 0, "g2s11 after a key made again the Licence cover says the licence follows it and the relay team stays with the old key, in English and in Polish: "
    + (bad.length ? JSON.stringify(bad) : "every part holds"));
};

/* ---- the team after the sweep (Claude alpha's ruling of 2026-10-25, option (b)) ------------------------------------------------ */

const RR_ED1 = "{\"kind\":\"etiuda-sealed\",\"note\":\"Harbour lamps, edition one, a sealed text\"}\n";
const RR_ED2 = "{\"kind\":\"etiuda-sealed\",\"note\":\"Harbour lamps, edition two, after the renewal\"}\n";
const RR_NOTE = "{\"inUse\":\"harbour-lamps one\"}\n", RR_AFTER = "{\"inUse\":\"harbour-lamps two, after the renewal\"}\n";
const RR_CREATE = /^POST https:\/\/etiuda\.dev\/relay\/v1\/teams\n/, RR_GRANT = /^POST https:\/\/etiuda\.dev\/relay\/v1\/t\/[0-9a-f]{32}\/grant\n/;
/* A team on the lab's relay with two desks of its roster, each the pinned channel as a desk runs it, every clock moved together by
   `at`: it works, then is swept (a paid grant ends at day 30 and its copy goes at day 120; with `o.trial`, a trial's ends at day 14
   and goes at day 44); with `o.off` the lead takes the second desk off with a new key while the team is gone; with `o.ended` a later
   grant that has itself ended is kept beside the key; with `o.renew` a grant that covers the day is kept there, as the quiet check or
   a purchase keeps it, and the next syncs run. Nothing is done for either desk at any step. What the legs read is returned, every
   runner and channel stopped. */
async function rrScene(name, o) {
  const x = o || {};
  const world = await relayWorld(), T0 = Date.now(), lab = labDir("relay-" + name), said = [];
  world.R.clock.now = T0;
  const D = deskKeys(), E = deskKeys();
  const s = await studioLead(world, lab, { roster: [D, E], wraps: true, say: (l) => said.push(l),
    grantOpts: x.trial ? { fields: { paid: false, until: T0 + 14 * G2_DAY } } : undefined });
  s.setClock(T0);
  const at = (ms) => { world.R.clock.now = ms; s.setClock(ms); };
  const clock = () => world.R.clock.now;
  const sync = async () => { await s.runner.sync(); await s.runner.idle(); };
  const kept = () => K.relayTeams(s.teamsFile).find((w) => w.team === s.teamId) || null;
  /* What the runner keeps of the relay's word on the team, apart from the head's own times. */
  const record = () => { const k = kept(); return JSON.stringify(k && [k.created, k.granted, k.lapse, k.lead, k.refusedLead, k.remade, k.enrolled]); };
  const keys = new Map([[1, s.teamKey]]);
  const dk = deskOf(world, lab, s, "kept", D, new Map([[1, s.teamKey]]), { clock });
  const de = deskOf(world, lab, s, "off", E, new Map([[1, s.teamKey]]), { clock });
  const out = { world, s, D, E, said, dk, de, kept, keys };
  /* The lead's files the relay holds, by path: each live blob of the lead's key opened under the team key of its epoch. */
  out.leadPaths = () => {
    const st = world.store(s.rt), paths = [];
    if (!st) return paths;
    for (const [k, v] of st.dump()) {
      if (!k.startsWith("blob:")) continue;
      const m = JSON.parse(v);
      if (m.writer !== s.lead.keyId || m.del) continue;
      const ct = world.R.bucket.objects.get(m.obj), key = keys.get(m.epoch);
      const r = ct && key ? world.B.openBlob({ blob: { id: m.id, epoch: m.epoch, supersedes: m.supersedes, writerKeyId: m.writer, counter: m.counter,
        nonce: m.nonce, signature: m.sig, ciphertext: ct }, relayTeamId: s.rt, epoch: m.epoch, teamKey: key,
        trust: { lead: { keyId: s.lead.keyId, public: s.lead.public }, desks: [] }, counters: {} }) : null;
      if (r && r.ok) paths.push(r.path);
    }
    return paths.sort();
  };
  out.creates = () => s.t.sent.filter((l) => RR_CREATE.test(l)).length;
  out.grantPosts = () => s.t.sent.filter((l) => RR_GRANT.test(l)).length;
  out.empty = () => !world.store(s.rt) || world.store(s.rt).dump().length === 0;
  /* A swept store keeps the lead's public key alone (engine 11bb4766, "a swept store is the mark alone"), and from the relay that dates its
     mark, the instant it dates from (sweptAt), read past here. */
  out.sweptStore = () => {
    const st = world.store(s.rt), rows = st ? st.dump().filter((r) => r[0] !== "sweptAt") : [];
    let sweptPub = null;
    try { sweptPub = rows.length === 1 ? JSON.parse(rows[0][1]) : null; } catch { sweptPub = null; }
    return rows.length === 1 && rows[0][0] === "swept" && sweptPub === s.lead.public;
  };
  out.dev = (k) => !!world.store(s.rt) && world.store(s.rt).get("dev:" + k.keyId) !== undefined;
  try {
    put(s.mirror, "harbour-lamps.ec", RR_ED1);
    await sync();
    dk.ch.start(); de.ch.start();
    await settle(dk.ch, de.ch);
    put(dk.mirror, "desks/" + D.keyId + "/in-use.ec", RR_NOTE);
    await settle(dk.ch);
    await sync();
    out.working = read(dk.mirror, "harbour-lamps.ec") === RR_ED1 && read(de.mirror, "harbour-lamps.ec") === RR_ED1
      && read(s.mirror, "desks/" + D.keyId + "/in-use.ec") === RR_NOTE && out.creates() === 1;
    out.before = g2Files([s.ud, dk.mirror, de.mirror]);
    const sweptAt = x.trial ? T0 + 45 * G2_DAY : T0 + 121 * G2_DAY;
    at(sweptAt);
    await sync(); await settle(dk.ch, de.ch); await sync();
    out.swept = out.sweptStore();
    out.goneAt = [dk.ch.lapse(), de.ch.lapse()].map((l) => (l ? l.step : "none")).join(",");
    if (x.off) {
      const h = await heldTeam(s.mirror, { key: s.keyAt });
      const next = await newEpoch(h.team, { key: s.keyAt, remove: E.keyId, secret: labSecret(s.keyAt) });
      K.keepTeamKey(s.teamsFile, s.vault, s.teamId, 2, next.teamKey);
      keys.set(2, next.teamKey);
      await writeTeam(s.mirror, next.team, { key: s.keyAt, passphrase: labSecret(s.keyAt) });
    }
    at(sweptAt + G2_DAY);
    if (x.ended) out.endedGrant = granted(s.keyAt, s.lead.public, sweptAt - 40 * G2_DAY);
    if (x.invite) {
      /* An invitation the lead makes while the team is gone: kept in the book, its registration refused until the space is back. */
      const secret = newSecret(), ri = Relay.relayInvite(secret);
      const made = makeInvite({ team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } }, "Ada Quay", secret, clock(),
        undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
      K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
      out.invite = ri;
    }
    if (x.squat) {
      if (x.oldRelay) {
        /* The relay without the tombstone (as the live Worker still runs, before pin 9a817191): the sweep leaves the store empty. */
        const st = world.store(s.rt);
        if (st) { st.del("swept"); st.del("sweptAt"); }
      }
      /* Another key, with a grant of its own, makes the swept id first. */
      const Q = keyPair(true);
      out.squatter = Q;
      out.squatMade = await world.admin("POST", "/relay/v1/teams", grantKit.createBody(s.rt, { keyId: Q.keyId, pub: Q.pub }, clock(),
        (bytes) => crypto.sign(null, bytes, Q.privateKey).toString("hex"), { now: clock() }));
    }
    out.keptBefore = record();
    await sync(); await settle(dk.ch, de.ch); await sync();
    out.keptAfter = record();
    out.stillSwept = out.sweptStore() && out.creates() === 1;
    if (x.renew) {
      const renewAt = sweptAt + 2 * G2_DAY;
      at(renewAt);
      out.grant2 = granted(s.keyAt, s.lead.public, renewAt);
      if (x.unavailable) {
        /* The relay answers the create with its own outage (a prefix it does not serve), once, and makes nothing. */
        out.unavailable = 0;
        s.t.answer = async (method, url) => {
          if (method !== "POST" || !/\/relay\/v1\/teams$/.test(String(url)) || out.unavailable) return null;
          out.unavailable = 503;
          return { status: 503, bytes: Buffer.from(JSON.stringify({ error: "unavailable", said: "The relay is not answering here." })), header: () => null };
        };
      }
      if (x.dropCreate) {
        /* The create reaches the relay, which makes the space, and its answer is lost on the way back. */
        out.dropped = 0;
        s.t.answer = async (method, url, headers, body) => {
          if (method !== "POST" || !/\/relay\/v1\/teams$/.test(String(url)) || out.dropped) return null;
          out.dropped = (await world.relayFetch(url, { method, headers, body })).status;
          return { status: 0, bytes: Buffer.alloc(0), header: () => null };
        };
      }
      if (x.sweptOther) {
        /* The pin's lab relay has no swept-other-lead. The stand-in answers the create as the next deploy does, and keeps
           answering, so a later sync cannot make the space by a plain create. */
        s.t.answer = async (method, url) => {
          if (method !== "POST" || !/\/relay\/v1\/teams$/.test(String(url))) return null;
          return refusalStood(SWEPT_OTHER_JSON);
        };
      }
      await sync();
      out.firstPosts = { grants: out.grantPosts(), creates: out.creates() };
      await settle(dk.ch, de.ch); await sync(); await settle(dk.ch, de.ch);
      put(s.mirror, "harbour-lamps.ec", RR_ED2);
      await sync(); await settle(dk.ch, de.ch);
      put(dk.mirror, "desks/" + D.keyId + "/after.ec", RR_AFTER);
      await settle(dk.ch); await sync();
    }
    if (typeof x.then === "function") await x.then({ out, s, world, at, clock, sync: async (o2) => { await s.runner.sync(o2); await s.runner.idle(); },
      settle: () => settle(dk.ch, de.ch) });
    out.after = new Set(g2Files([s.ud, dk.mirror, de.mirror]));
    out.online = { kept: dk.ch.online(), off: de.ch.online() };
  } finally {
    await s.runner.stop(); await dk.ch.stop(); await de.ch.stop();
  }
  return out;
}
const rrEpoch = (dir) => { try { return JSON.parse(read(dir, "etiuda-team.json")).epoch; } catch { return null; } };
const rrStep = (ch) => { const l = ch.lapse(); return l ? l.step : "none"; };
/* The relay holds the team again under the same id and lead key, with the renewed grant's end; the lead's team file and edition are
   back there; the roster as it stands is enrolled. */
function rrBack(r) {
  const row = r.world.store(r.s.rt) ? r.world.store(r.s.rt).get("team") : null, paths = r.leadPaths(), k = r.kept();
  return { remade: !!row && row.rt === r.s.rt && row.lead.keyId === r.s.lead.keyId && row.until === r.grant2.until && r.creates() === 2,
    filesBack: paths.indexOf("etiuda-team.json") >= 0 && paths.indexOf("harbour-lamps.ec") >= 0, rosterPosted: r.dev(r.D),
    keptWorking: !!k && !!k.lapse && k.lapse.state === "working" && k.lapse.until === r.grant2.until && k.remade === false, paths: JSON.stringify(paths) };
}

/* A paid team swept, its lead holding no grant that covers the day (only a later one that has itself ended): no sync makes anything
   again. Nothing is posted (no create, no grant), the relay holds nothing, the runner's record of the team is as it was, the lapse
   it keeps still stands at gone, and both desks are still told gone. */
LEGS.g2s12 = async () => {
  const r = await rrScene("g2s12", { ended: true });
  const k = r.kept(), step = Relay.lapseStep(k && k.lapse, r.world.R.clock.now);
  const ok = { working: r.working === true, swept: r.swept === true, desksGone: r.goneAt === "gone,gone", nothingMade: r.stillSwept === true,
    nothingPosted: r.grantPosts() === 0, recordAsItWas: r.keptBefore === r.keptAfter, stillGone: !!step && step.step === "gone",
    desksStillGone: rrStep(r.dk.ch) === "gone" && rrStep(r.de.ch) === "gone" };
  check(Object.values(ok).every((v) => v === true), "g2s12 a swept team with no grant covering the day stays swept, and a sync makes nothing again: " + g2Line(ok)
    + "; creates " + r.creates() + ", grant posts " + r.grantPosts());
};

/* The grant renewed after the sweep: the next sync posts it, the relay answers that it holds no such team, and Studio makes the space
   again under the same relay team id and lead key, puts the mirror's root back (the team file and the latest edition among it) and
   enrols the roster as it stands. */
LEGS.g2s13 = async () => {
  const r = await rrScene("g2s13", { off: true, renew: true });
  const b = rrBack(r);
  const ok = { working: r.working === true, swept: r.swept === true, notBeforeRenewal: r.stillSwept === true, remade: b.remade,
    filesBack: b.filesBack, rosterPosted: b.rosterPosted, keptWorking: b.keptWorking };
  check(Object.values(ok).every((v) => v === true), "g2s13 a paid team renewed after its sweep is made again at the next sync under the same id, with its team file,"
    + " its latest edition and its roster: " + g2Line(ok) + "; the lead's files at the relay " + b.paths + ", said " + JSON.stringify(r.said.slice(-2)));
};

/* A desk on the roster, its key and team file kept through the sweep, reaches the team again by itself, nothing done for it: it reads
   the new key's team file and the edition published after the renewal, it is told the team works, and what it writes reaches Studio. */
LEGS.g2s14 = async () => {
  const r = await rrScene("g2s14", { off: true, renew: true });
  const ok = { desksGone: r.goneAt === "gone,gone", newEdition: read(r.dk.mirror, "harbour-lamps.ec") === RR_ED2, newKeysFile: rrEpoch(r.dk.mirror) === 2,
    toldWorking: r.dk.ch.lapse() === null, online: !!r.online && r.online.kept === true, itsFileReaches: read(r.s.mirror, "desks/" + r.D.keyId + "/after.ec") === RR_AFTER };
  check(Object.values(ok).every((v) => v === true), "g2s14 a desk still on the roster reaches the team again by itself after the renewal: " + g2Line(ok)
    + "; its place in the relay's sequence " + r.dk.prog.state().seq);
};

/* A desk the lead took off while the team was gone is not admitted after the renewal: the relay does not enrol it, it opens no session,
   and it reads nothing published since; it is still told the team's copy is gone. */
LEGS.g2s15 = async () => {
  const r = await rrScene("g2s15", { off: true, renew: true });
  const ok = { keptBack: r.dev(r.D), notEnrolled: !r.dev(r.E), noSession: !!r.online && r.online.off === false, oldEdition: read(r.de.mirror, "harbour-lamps.ec") === RR_ED1,
    oldTeamFile: rrEpoch(r.de.mirror) === 1, stillGone: rrStep(r.de.ch) === "gone" };
  check(Object.values(ok).every((v) => v === true), "g2s15 a desk taken off while the team was lapsed is not admitted after the renewal: " + g2Line(ok));
};

/* A trial's team swept 30 days after the trial ended, then bought: the same as a paid team renewed, at the next sync. */
LEGS.g2s16 = async () => {
  const r = await rrScene("g2s16", { trial: true, renew: true });
  const b = rrBack(r);
  const ok = { working: r.working === true, swept: r.swept === true, notBeforePurchase: r.stillSwept === true, remade: b.remade,
    filesBack: b.filesBack, rosterPosted: b.rosterPosted && r.dev(r.E), keptWorking: b.keptWorking,
    desksBack: read(r.dk.mirror, "harbour-lamps.ec") === RR_ED2 && read(r.de.mirror, "harbour-lamps.ec") === RR_ED2 && r.dk.ch.lapse() === null && r.de.ch.lapse() === null };
  check(Object.values(ok).every((v) => v === true), "g2s16 a trial's team swept and then bought is made again at the next sync, and both desks come back: "
    + g2Line(ok) + "; the lead's files at the relay " + b.paths);
};

/* Nothing is deleted on a desk or in Studio across the whole cycle, working, swept, a desk taken off, renewed: every file under
   Studio's user data folder (the mirror, its record, the teams file, the key and the grant among them) and under each desk's mirror
   is still there, and both team keys are kept. A copy short of one file reads as changed, so the comparison reads. */
LEGS.g2s17 = async () => {
  const r = await rrScene("g2s17", { off: true, renew: true });
  const missing = r.before.filter((f) => !r.after.has(f));
  const held = K.teamKeysOf(r.s.teamsFile, r.s.vault)[r.s.teamId] || {};
  const short = new Set(r.before.slice(1)), control = r.before.some((f) => !short.has(f));
  const ok = { files: r.before.length >= 6 && missing.length === 0, keys: !!held[1] && !!held[2], control };
  check(Object.values(ok).every((v) => v === true), "g2s17 nothing on the desks or in Studio is deleted at any step of a sweep and a renewal: " + g2Line(ok)
    + "; files " + r.before.length + (missing.length ? ", missing " + JSON.stringify(missing.slice(0, 4)) : ""));
};

/* The page says what a renewal does after the deletion, in Claudette's words, in English and in Polish; and the steps before it
   say where a licence is renewed as she corrected it. */
LEGS.g2s18 = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const want = {
    en: { gone: "Renewing the licence brings the team back: at the next sync Studio puts it on the relay again with its latest edition, and the teammates on the team's list rejoin by themselves. To renew: Menu, then Settings, then Licence.",
      renew: "A licence is renewed from the Menu, under Settings, then Account." },
    pl: { gone: "Po odnowieniu licencji zespół wróci sam: przy następnej synchronizacji Studio ponownie umieści go na przekaźniku z najnowszym wydaniem, a członkowie z listy zespołu dołączą sami. Licencję można odnowić z menu, w Ustawieniach, w części Licencja.",
      renew: "Licencję odnawia się z menu, w Ustawieniach, w części Konto." } };
  const bad = [];
  for (const lang of ["en", "pl"]) {
    const P = loadPage({ api: {}, uiLang: lang }).page;
    const row = (step) => ({ team: "t-0011223344556677", names: [], step, until: "2026-11-02", readOnly: step === "lapsed" || step === "gone" ? null : "2026-12-02", swept: "2027-01-31" });
    const gone = P.lapseSaid ? P.lapseSaid(row("gone")) : "";
    if (!gone.endsWith(" " + want[lang].gone)) bad.push(lang + " gone: " + gone);
    for (const step of ["grace", "read-only"]) {
      const line = P.lapseSaid ? P.lapseSaid(row(step)) : "";
      if (!line.endsWith(" " + want[lang].renew)) bad.push(lang + " " + step + ": " + line);
    }
  }
  check(bad.length === 0, "g2s18 the page says after the deletion that a renewal brings the team back, and where a licence is renewed, in English and in Polish: "
    + (bad.length ? JSON.stringify(bad) : "every part holds"));
};

/* The test architect's H1 on the build: the create that makes the space again reaches the relay, and its answer is lost. The next sync
   finishes what the create began: the roster is enrolled, an invitation the lead made while the team was gone is registered, and the
   kept desk reads the team again. */
LEGS.g2s19 = async () => {
  const r = await rrScene("g2s19", { renew: true, invite: true, dropCreate: true });
  const row = r.world.store(r.s.rt) ? r.world.store(r.s.rt).get("team") : null;
  const ok = { answerLost: r.dropped === 200, remade: !!row && row.lead.keyId === r.s.lead.keyId, rosterPosted: r.dev(r.D) && r.dev(r.E),
    inviteRegistered: !!r.invite && !!r.world.store(r.s.rt) && r.world.store(r.s.rt).get("inv:" + r.invite.inv) !== undefined,
    deskBack: read(r.dk.mirror, "harbour-lamps.ec") === RR_ED2 && r.dk.ch.lapse() === null };
  check(Object.values(ok).every((v) => v === true), "g2s19 a create whose answer is lost after the relay made the space is finished at the next sync: " + g2Line(ok));
};

/* Another key's create on a swept id is refused swept-other-lead (the id kept for its own lead); the lead's own team is
   not marked taken, and comes back at its next sync under the same id with its latest edition, its team file and its roster. */
LEGS.g2s20 = async () => {
  const r = await rrScene("g2s20", { renew: true, squat: true });
  const b = rrBack(r), k = r.kept();
  const ok = { refusedOther: !!r.squatMade && r.squatMade.status === 403 && !!r.squatMade.json && r.squatMade.json.error === "swept-other-lead",
    notTaken: !!k && k.taken === false && !r.said.some((l) => l.indexOf(Relay.TAKEN_SAID) >= 0),
    remade: b.remade === true, filesBack: b.filesBack === true, rosterPosted: b.rosterPosted === true, keptWorking: b.keptWorking === true,
    deskBack: read(r.dk.mirror, "harbour-lamps.ec") === RR_ED2 && r.dk.ch.lapse() === null };
  check(Object.values(ok).every((v) => v === true), "g2s20 another key's create on a swept id is refused swept-other-lead, the lead is not taken, and the team comes back: " + g2Line(ok)
    + "; squat status " + (r.squatMade && r.squatMade.status) + " " + (r.squatMade && r.squatMade.json && r.squatMade.json.error));
};

/* The test architect's H4: the relay's own outage answering the remake (503 unavailable) is no taken place. The team is not marked
   taken, nothing is said of a place taken, and the next sync makes the space again and brings the kept desk back. */
LEGS.g2s23 = async () => {
  const r = await rrScene("g2s23", { renew: true, unavailable: true });
  const row = r.world.store(r.s.rt) ? r.world.store(r.s.rt).get("team") : null, k = r.kept();
  const ok = { outage: r.unavailable === 503, notTaken: !!k && k.taken === false, notSaid: !r.said.some((l) => l.indexOf(Relay.TAKEN_SAID) >= 0),
    remade: !!row && row.lead.keyId === r.s.lead.keyId, deskBack: read(r.dk.mirror, "harbour-lamps.ec") === RR_ED2 && r.dk.ch.lapse() === null };
  check(Object.values(ok).every((v) => v === true), "g2s23 a remake answered 503 unavailable is not taken, and the team comes back at the next sync: " + g2Line(ok));
};

/* A team marked taken is asked again: not at a plain sync, but at one Check now asks for (still taken: one create
   more, nothing else), and once the place is free again (the other key's copy gone), asked again, the space is made
   and the team is no longer taken. */
LEGS.g2s24 = async () => {
  const world = await relayWorld(), lab = labDir("relay-g2s24"), said = [];
  world.R.clock.now = Date.now();
  const D = deskKeys();
  const s = await studioLead(world, lab, { roster: [D], wraps: true, say: (l) => said.push(l) });
  const Q = keyPair(true), now = world.R.clock.now;
  const squat = await world.admin("POST", "/relay/v1/teams", grantKit.createBody(s.rt, { keyId: Q.keyId, pub: Q.pub }, now,
    (bytes) => crypto.sign(null, bytes, Q.privateKey).toString("hex"), { now }));
  const creates = () => s.t.sent.filter((l) => RR_CREATE.test(l)).length;
  put(s.mirror, "harbour-lamps.ec", RR_ED1);
  const dk = deskOf(world, lab, s, "kept", D, new Map([[1, s.teamKey]]), { clock: () => world.R.clock.now });

  const seen = {};
  try {
    await s.runner.sync(); await s.runner.idle();
    const k0 = K.relayTeams(s.teamsFile).find((w) => w.team === s.teamId) || null;
    seen.marked = squat.status === 200 && !!k0 && k0.taken === true;
    const c0 = creates();
    await s.runner.sync(); await s.runner.idle();
    const c1 = creates();
    seen.plainQuiet = c1 === c0;
    await s.runner.sync({ askTaken: true }); await s.runner.idle();
    const c2 = creates();
    const k2 = K.relayTeams(s.teamsFile).find((w) => w.team === s.teamId) || null;
    seen.askedAgain = c2 === c1 + 1 && !!k2 && k2.taken === true;
    /* The other key's copy gone from the relay, as its own sweep leaves it. */
    const st = world.store(s.rt);
    for (const [k] of st.dump()) st.del(k);
    await s.runner.sync({ askTaken: true }); await s.runner.idle();
    dk.ch.start();
    await settle(dk.ch);
    await s.runner.sync(); await s.runner.idle();
    await settle(dk.ch);
    const k3 = K.relayTeams(s.teamsFile).find((w) => w.team === s.teamId) || null;
    const row = world.store(s.rt) ? world.store(s.rt).get("team") : null;
    seen.back = !!k3 && k3.taken === false && !!row && row.lead.keyId === s.lead.keyId;
  } finally {
    await s.runner.stop(); await dk.ch.stop();
  }
  const ok = { marked: seen.marked === true, plainQuiet: seen.plainQuiet === true, askedAgain: seen.askedAgain === true, back: seen.back === true,
    deskBack: read(dk.mirror, "harbour-lamps.ec") === RR_ED1 && dk.ch.lapse() === null };
  check(Object.values(ok).every((v) => v === true), "g2s24 a team marked taken is asked again at Check now, and comes back once its place is free: " + g2Line(ok));
};

/* The next deploy's two refusals, as relay/team.cjs answers them (status 403, JSON {error, said}). The pin's lab relay has neither. */
const REVOKED_EN = "The relay no longer accepts the key that signed this team's relay licence, so Studio is fetching a new licence from the licence service. This normally takes minutes, at most an hour, and nothing needs doing here. Until then the team keeps working with the catalog it has, but nothing new reaches it through the relay, and Studio cannot publish through it.";
const REVOKED_PL = "Przekaźnik nie przyjmuje już klucza, którym podpisano licencję przekaźnika dla tego zespołu, więc Studio pobiera nową licencję z usługi licencji. Zwykle trwa to kilka minut, najwyżej godzinę, i nic nie trzeba robić. Do tego czasu zespół działa na katalogu, który ma, ale nic nowego nie dociera do niego przez przekaźnik, a Studio nie może przez niego publikować.";
const REVOKED_FETCH_EN = "The relay no longer accepts the key that signed this team's relay licence, so Studio is fetching a new licence from the licence service. This normally takes minutes, at most an hour, and nothing needs doing here. Until then the team keeps working with the catalog it has, but nothing new reaches it through the relay, and Studio cannot publish through it.";
const REVOKED_FETCH_PL = "Przekaźnik nie przyjmuje już klucza, którym podpisano licencję przekaźnika dla tego zespołu, więc Studio pobiera nową licencję z usługi licencji. Zwykle trwa to kilka minut, najwyżej godzinę, i nic nie trzeba robić. Do tego czasu zespół działa na katalogu, który ma, ale nic nowego nie dociera do niego przez przekaźnik, a Studio nie może przez niego publikować.";
const REVOKED_NONE_EN = "The relay no longer accepts the key that signed this team's relay licence, and Studio could not get a new licence for it yet. Check now, under Menu, then Settings, then Licence, tries again; if it still finds none, write to us through etiuda.dev. Until then the team keeps working with the catalog it has, but nothing new reaches it through the relay, and Studio cannot publish through it.";
const REVOKED_NONE_PL = "Przekaźnik nie przyjmuje już klucza, którym podpisano licencję przekaźnika dla tego zespołu, a Studio nie zdołało jeszcze pobrać dla niego nowej licencji. Przycisk Sprawdź teraz (menu, Ustawienia, Licencja) próbuje ponownie; jeśli i wtedy jej nie znajdzie, prosimy o wiadomość przez etiuda.dev. Do tego czasu zespół działa na katalogu, który ma, ale nic nowego nie dociera do niego przez przekaźnik, a Studio nie może przez niego publikować.";
const revokedEnc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
async function revokedCover(step, en, pl) {
  const { loadPage } = await import("./page-stand-in.mjs");
  const bad = [];
  const want = { en: en, pl: pl };
  for (const lang of ["en", "pl"]) {
    const P = loadPage({ api: {}, uiLang: lang }).page;
    const x = { team: "t-0011223344556677", names: ["Lantern Quay"], step: step, until: null, readOnly: null, swept: null };
    const text = P.lapseSaid ? P.lapseSaid(x) : "";
    if (text !== want[lang]) bad.push(lang + " lapse");
    P.S.lic = { licence: { status: "active" }, grant: null, by: "email", hasKey: true, relayTeams: [x] };
    if (String(P.licenceCoverHtml()).indexOf(revokedEnc(want[lang])) < 0) bad.push(lang + " cover");
  }
  return bad;
}
const REVOKED_JSON = "{\"error\":\"revoked\",\"said\":\"That grant was signed by a revoked key, so the relay did not take it.\"}";
const SWEPT_OTHER_JSON = "{\"error\":\"swept-other-lead\",\"said\":\"This team id is kept for its own lead, so a create under another key is not taken.\"}";
function refusalStood(json) {
  return { status: 403, bytes: Buffer.from(json), header: (n) => {
    const h = String(n || "").toLowerCase();
    if (h === "content-type") return "application/json";
    if (h === "cache-control") return "no-store";
    return null;
  } };
}
/* A second service key, signed by the lab's root, so a grant of the same end can name another signer than the kit's one delegate. */
function secondGrantSigner(now) {
  const pair = crypto.generateKeyPairSync("ed25519");
  const pub = pair.publicKey.export({ type: "spki", format: "der" }).subarray(ED_SPKI.length).toString("hex");
  const pinCore = nodeRequire(path.join(ROOT, "engine", "pinned", "relay", "core.cjs"));
  const via = { kind: "etiuda-delegation", format: 1, key: { id: "test-delegate-2", pub: pub }, may: ["relay-grant"],
    from: now - 10 * grantKit.DAY, until: now + 100 * grantKit.DAY,
    sig: { alg: "ed25519", keyId: grantKit.ROOT.id, value: "" } };
  via.sig.value = crypto.sign(null, pinCore.delegationBytes(via), grantKit.ROOT.privateKey).toString("hex");
  return { id: "test-delegate-2", pub: pub, privateKey: pair.privateKey, via: via };
}
/* The lab relay told that `keys` are revoked, as the live relay is: a list signed by the lab's root, set as the Worker's REVOKED.
   Since the pin's relay core of 4cd12b27 (Argon's relay finding 7) a renewal that does not move the team on is taken under another
   key only where the key in force is on that list, so a leg whose replacement grant must be taken tells the lab relay first. */
function revokeOnLab(world, keys) {
  const pinCore = nodeRequire(path.join(ROOT, "engine", "pinned", "relay", "core.cjs"));
  const doc = { kind: "etiuda-revocations", format: 1, serial: 1, keys: keys.slice().sort(), sig: { alg: "ed25519", keyId: grantKit.ROOT.id, value: "" } };
  doc.sig.value = crypto.sign(null, pinCore.revocationBytes(doc), grantKit.ROOT.privateKey).toString("hex");
  world.R.env.REVOKED = JSON.stringify(doc);
}
function grantPubsOf(t) {
  const out = [];
  for (const line of t.sent) {
    if (!RR_GRANT.test(line)) continue;
    const at = line.lastIndexOf("\n{");
    if (at < 0) continue;
    try {
      const body = JSON.parse(line.slice(at + 1));
      const pub = body && body.grant && body.grant.via && body.grant.via.key ? body.grant.via.key.pub : "";
      out.push(String(pub || ""));
    } catch { out.push(""); }
  }
  return out;
}

/* A remake the relay refuses as swept-other-lead: another key's swept id, said once in the taken-place words, and not posted again. */
LEGS.g2s25 = async () => {
  const r = await rrScene("g2s25", { renew: true, sweptOther: true });
  const k = r.kept();
  const line = "relay of team " + r.s.teamId + ": " + Relay.TAKEN_SAID;
  const ok = { kept: !!k && k.taken === true, saidOnce: r.said.filter((l) => l === line).length === 1,
    notEngine: !r.said.some((l) => l.indexOf("kept for its own lead") >= 0),
    notReposted: !!r.firstPosts && r.grantPosts() === r.firstPosts.grants && r.creates() === r.firstPosts.creates };
  check(Object.values(ok).every((v) => v === true), "g2s25 a remake answered swept-other-lead is said once as taken, and not posted again: " + g2Line(ok)
    + "; said " + JSON.stringify(r.said.filter((l) => l.indexOf(r.s.teamId) >= 0).slice(-4)));
};

/* A hello the relay refuses as revoked. The grant held is the revoked key's, so Studio fetches at once; the grant that comes back
   ends no later, which owesGrant does not post, and the revoked path posts it anyway. The sentence is said while that stands and
   gone once the relay has accepted the new grant. The stand-in answers revoked until that grant is posted, and the lab relay is told
   the kit's delegate is revoked, as the live one is, so it takes the grant from another key (relay core 4cd12b27). */
LEGS.g2s26 = async () => {
  const Client = await import("../src/licence-client.mjs");
  const Lic = await import("../src/licence.mjs");
  const world = await relayWorld(), lab = labDir("relay-g2s26"), said = [], during = { calls: 0, postedEarly: -1, owed: null, kept: "", flag: false, sentence: false };
  const signer = secondGrantSigner(Date.now());
  const licRoot = crypto.generateKeyPairSync("ed25519");
  const trusted = licRoot.publicKey.export({ type: "spki", format: "der" }).subarray(ED_SPKI.length).toString("hex");
  const box = { t: null, ud: "", teamId: "", keyAt: "" };
  const fetchGrant = async () => {
    during.calls += 1;
    const row = K.relayTeams(K.teamsFile(box.ud)).find((w) => w.team === box.teamId);
    during.flag = !!(row && row.revoked);
    during.sentence = said.some((l) => l === "relay of team " + box.teamId + ": " + REVOKED_EN);
    during.postedEarly = grantPubsOf(box.t).filter((p) => p === signer.pub).length;
    const held = JSON.parse(fs.readFileSync(path.join(box.ud, "relay-grant.json"), "utf8"));
    const lead = readKeyFile(box.keyAt).public;
    const fresh = grantKit.grantFor(lead, Date.now(), { via: signer.via, signer: { id: signer.id, privateKey: signer.privateKey }, keyId: signer.id,
      fields: { until: held.until, issued: held.issued, paid: true } });
    during.owed = Relay.owesGrant(row, fresh);
    const open = unlockKey(readKeyFile(box.keyAt), labSecret(box.keyAt));
    const list = Lic.createTestRevocations({ keys: [grantKit.DELEGATE.pub], serial: 1 }, licRoot.privateKey, "test-licence-root");
    const answer = await Client.quietCheck(async () => ({ status: 200, bytes: Buffer.from(JSON.stringify({ ok: true, grant: fresh, revoked: list })) }), open, Date.now());
    const got = await Client.take(answer, { lead: lead, licenceFile: path.join(box.ud, "etiuda-studio-licence.json"),
      grantFile: path.join(box.ud, "relay-grant.json"), trustedKey: trusted, roots: GRANT_ROOTS, now: Date.now() });
    during.kept = got.grant;
  };
  const s = await studioLead(world, lab, { say: (l) => said.push(l),
    grantOpts: { via: grantKit.delegationFor(Date.now()), signer: grantKit.DELEGATE, keyId: grantKit.DELEGATE.id },
    runner: { fetchGrant: fetchGrant, revokedKeys: () => {
      const kept = Lic.readRevocations(Lic.revokedFileFor(path.join(box.ud, "etiuda-studio-licence.json")), trusted);
      return kept ? kept.keys : [];
    } } });
  box.t = s.t; box.ud = s.ud; box.teamId = s.teamId; box.keyAt = s.keyAt;
  const at = Date.now();
  world.R.clock.now = at; s.setClock(at);
  const sync = async () => { await s.runner.sync(); await s.runner.idle(); };
  let shell = null;
  const ok = { made: false, saidOnce: false, notEngine: false, owed: false, kept: false, notEarly: false, postedOnce: false,
    cleared: false, labTook: false, page: false, shell: false, shellGone: false, words: Relay.REVOKED_SAID === REVOKED_EN };
  const bad = [];
  try {
    await sync();
    ok.made = !!world.store(s.rt) && !!world.store(s.rt).get("team");
    revokeOnLab(world, [grantKit.DELEGATE.pub]);
    let passed = false, labTook = 0;
    s.t.answer = async (method, url, headers, body) => {
      if (String(url).indexOf("/relay/v1/") < 0) return null;
      if (passed) return null;
      let posted = "";
      try {
        const json = JSON.parse(Buffer.from(body || []).toString("utf8"));
        posted = json && json.grant && json.grant.via && json.grant.via.key ? String(json.grant.via.key.pub) : "";
      } catch { posted = ""; }
      if (method === "POST" && /\/grant$/.test(String(url)) && posted && posted !== grantKit.DELEGATE.pub) {
        const res = await world.relayFetch(url, { method: method, headers: headers, body: body });
        const bytes = Buffer.from(await res.arrayBuffer());
        labTook = res.status;
        if (res.status === 200) passed = true;
        return { status: res.status, bytes: bytes, header: (n) => res.headers.get(n) };
      }
      return refusalStood(REVOKED_JSON);
    };
    await sync();
    await sync();
    const line = "relay of team " + s.teamId + ": " + REVOKED_EN;
    ok.saidOnce = said.filter((l) => l === line).length === 1;
    ok.notEngine = !said.some((l) => l.indexOf("signed by a revoked key") >= 0 || l.indexOf("The relay answered 403") >= 0);
    ok.owed = during.owed === false;
    ok.kept = during.kept === "kept";
    ok.notEarly = during.postedEarly === 0;
    ok.postedOnce = grantPubsOf(s.t).filter((p) => p === signer.pub).length === 1 && during.calls === 1;
    const row = K.relayTeams(s.teamsFile).find((w) => w.team === s.teamId);
    ok.cleared = !!row && row.revoked === false && row.grantKey === signer.pub;
    ok.labTook = labTook === 200;
    const { loadPage } = await import("./page-stand-in.mjs");
    const enc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const want = { en: REVOKED_EN, pl: REVOKED_PL };
    for (const lang of ["en", "pl"]) {
      const P = loadPage({ api: {}, uiLang: lang }).page;
      const x = { team: s.teamId, names: ["Lantern Quay"], step: "revoked", until: null, readOnly: null, swept: null };
      const text = P.lapseSaid ? P.lapseSaid(x) : "";
      const away = P.lapseSaid ? P.lapseSaid(x, true) : "";
      if (text !== want[lang] || away !== want[lang]) bad.push(lang + " lapse");
      P.S.lic = { licence: { status: "active" }, grant: null, by: "email", hasKey: true, relayTeams: [x] };
      if (String(P.licenceCoverHtml()).indexOf(enc(want[lang])) < 0) bad.push(lang + " cover");
      const quiet = { team: s.teamId, names: [], step: "grace", until: "2026-11-02", readOnly: "2026-12-02", swept: "2027-01-31" };
      if (String(P.lapseSaid ? P.lapseSaid(quiet) : "").indexOf(want[lang]) >= 0) bad.push(lang + " still");
    }
    ok.page = bad.length === 0;
    await s.runner.stop();
    K.markRelay(s.teamsFile, s.teamId, { revoked: true });
    /* A hello the shell's own sync accepted would clear the mark (E2) before the cover is read. The relay does not answer. */
    s.t.down = true;
    shell = await loadStudioShell(s.ud, { relay: s.t, env: { STUDIO_SIGNING_KEY: s.keyAt, STUDIO_RELAY_ROOT: GRANT_ROOT_PUB },
      thread: async (verb) => (verb === "listProjects" ? { projects: [] } : {}) });
    const lic = await shell.ask("studio:licence");
    ok.shell = !!lic && Array.isArray(lic.relayTeams) && lic.relayTeams.some((t) => t.team === s.teamId && t.step === "revoked");
    K.markRelay(s.teamsFile, s.teamId, { revoked: false });
    const gone = await shell.ask("studio:licence");
    ok.shellGone = !!gone && !(Array.isArray(gone.relayTeams) && gone.relayTeams.some((t) => t.step === "revoked"));
  } finally {
    try { await s.runner.stop(); } catch { /* already stopped */ }
    if (shell) { try { await shell.done(); } catch { /* the shell is already down */ } }
  }
  check(Object.values(ok).every((v) => v === true), "g2s26 a revoked answer fetches a same-end grant from another key, the relay accepts it, and the sentence is said and then gone: "
    + g2Line(ok) + (bad.length ? "; page " + JSON.stringify(bad) : "") + "; said " + JSON.stringify(said.slice(-4)));
};

/* One lead, one team, the kit's delegate signing the grant the create posts. `runner` is handed to the runner as a leg adds it
   (a fetch). The clock starts at one instant, and jump moves the lab and the runner together, past the channel's 25 minutes. */
async function revokedLead(name, runner) {
  const world = await relayWorld(), lab = labDir("relay-" + name), said = [];
  const s = await studioLead(world, lab, { say: (l) => said.push(l),
    grantOpts: { via: grantKit.delegationFor(Date.now()), signer: grantKit.DELEGATE, keyId: grantKit.DELEGATE.id },
    runner: runner || {} });
  let at = Date.now();
  world.R.clock.now = at; s.setClock(at);
  const sync = async () => { await s.runner.sync(); await s.runner.idle(); };
  const jump = (ms) => { at += ms; world.R.clock.now = at; s.setClock(at); return at; };
  return { world, lab, said, s, sync, jump };
}
/* The grant on disk replaced by one of the same end from `signer`, and the row's grantKey cleared, as a team saved before that
   field was kept. The relay still holds the grant the create posted. */
function putSameEnd(s, signer, now) {
  const held = JSON.parse(fs.readFileSync(path.join(s.ud, "relay-grant.json"), "utf8"));
  const fresh = grantKit.grantFor(readKeyFile(s.keyAt).public, now, { via: signer.via, signer: { id: signer.id, privateKey: signer.privateKey }, keyId: signer.id,
    fields: { until: held.until, issued: held.issued, paid: true } });
  fs.writeFileSync(path.join(s.ud, "relay-grant.json"), JSON.stringify(fresh, null, 1) + "\n");
  K.markRelay(s.teamsFile, s.teamId, { grantKey: "" });
  return fresh;
}
const helloRevoked = (method, url) => (method === "POST" && /\/hello$/.test(String(url)) ? refusalStood(REVOKED_JSON) : null);
const SHELL_ENV = (s) => ({ STUDIO_SIGNING_KEY: s.keyAt, STUDIO_RELAY_ROOT: GRANT_ROOT_PUB });
const SHELL_THREAD = async (verb) => (verb === "listProjects" ? { projects: [] } : {});

/* E1. grantKey empty, the replacement already on disk, a revoked hello: that grant is posted and the row clears. The row's grantKey
   is Studio's record; the lab relay still holds the delegate's key in force, and is told it is revoked, as the live relay is. */
LEGS.g2s27 = async () => {
  const box = await revokedLead("g2s27");
  const signer = secondGrantSigner(Date.now());
  const ok = { posted: false, cleared: false };
  try {
    await box.sync();
    putSameEnd(box.s, signer, Date.now());
    revokeOnLab(box.world, [grantKit.DELEGATE.pub]);
    box.s.t.answer = helloRevoked;
    box.jump(26 * 60 * 1000);
    await box.sync();
    ok.posted = grantPubsOf(box.s.t).indexOf(signer.pub) >= 0;
    const row = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.cleared = !!row && row.revoked === false && row.grantKey === signer.pub;
  } finally { try { await box.s.runner.stop(); } catch { /* already stopped */ } }
  check(Object.values(ok).every((v) => v === true), "g2s27 an empty grantKey, the replacement already on disk, and a revoked hello: that grant is posted: "
    + g2Line(ok));
};

/* E2. A revoked mark clears when the next hello is accepted, though this Studio posted nothing. */
LEGS.g2s28 = async () => {
  const box = await revokedLead("g2s28");
  const ok = { hello: false, cleared: false };
  try {
    await box.sync();
    K.markRelay(box.s.teamsFile, box.s.teamId, { revoked: true });
    const from = box.s.t.log.length;
    box.jump(26 * 60 * 1000);
    await box.sync();
    ok.hello = box.s.t.log.slice(from).some((l) => l === "POST hello" || (l.indexOf("POST ") === 0 && /\/hello$/.test(l)));
    const row = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.cleared = !!row && row.revoked === false;
  } finally { try { await box.s.runner.stop(); } catch { /* already stopped */ } }
  check(Object.values(ok).every((v) => v === true), "g2s28 a revoked mark clears when the next hello is accepted: " + g2Line(ok)
    + "; log " + JSON.stringify(box.s.t.log.slice(-6)));
};

/* E3. A revoked hello, then the grant post answered 403 for another reason: that second refusal is said, and the revoked body's
   own sentence is not. The replacement is already on disk, so the post is the one the revoked hello makes. */
LEGS.g2s29 = async () => {
  const box = await revokedLead("g2s29");
  const signer = secondGrantSigner(Date.now());
  const ok = { posted: false, said: false, notBody: false };
  try {
    await box.sync();
    putSameEnd(box.s, signer, Date.now());
    box.s.t.answer = (method, url) => {
      const u = String(url);
      if (method === "POST" && /\/hello$/.test(u)) return refusalStood(REVOKED_JSON);
      if (method === "POST" && /\/grant$/.test(u)) return refusalStood("{\"error\":\"quota\"}");
      return null;
    };
    box.jump(26 * 60 * 1000);
    await box.sync();
    ok.posted = grantPubsOf(box.s.t).indexOf(signer.pub) >= 0;
    ok.said = box.said.some((l) => l.indexOf("The relay answered 403.") >= 0);
    ok.notBody = !box.said.some((l) => l.indexOf("signed by a revoked key") >= 0);
  } finally { try { await box.s.runner.stop(); } catch { /* already stopped */ } }
  check(Object.values(ok).every((v) => v === true), "g2s29 a revoked hello, then a grant post answered 403 for another reason, and the second is said: "
    + g2Line(ok) + "; said " + JSON.stringify(box.said.filter((l) => l.indexOf(box.s.teamId) >= 0).slice(-4)));
};

/* E4, state 1. While the fetch is in flight the refusal line and the cover say Studio is fetching, and the row is not yet the
   nothing-found state. */
LEGS.g2s30 = async () => {
  let release = () => {};
  const gate = new Promise((r) => { release = r; });
  let entered = false;
  const box = await revokedLead("g2s30", { fetchGrant: async () => { entered = true; await gate; } });
  const ok = { saw: false, fetching: false, notNone: false, row: false, cover: false, words: false };
  const cover = [];
  try {
    await box.sync();
    box.s.t.answer = helloRevoked;
    box.jump(26 * 60 * 1000);
    const job = box.sync();
    ok.saw = await until(() => entered, 25000);
    const line = "relay of team " + box.s.teamId + ": " + REVOKED_FETCH_EN;
    ok.fetching = box.said.indexOf(line) >= 0;
    ok.notNone = box.said.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_NONE_EN) < 0;
    const row = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.row = !!row && row.revoked === true && row.revokedNone !== true;
    ok.words = Relay.REVOKED_SAID === REVOKED_FETCH_EN;
    release();
    await job;
    cover.push.apply(cover, await revokedCover("revoked", REVOKED_FETCH_EN, REVOKED_FETCH_PL));
    ok.cover = cover.length === 0;
  } finally {
    release();
    try { await box.s.runner.stop(); } catch { /* already stopped */ }
  }
  check(Object.values(ok).every((v) => v === true), "g2s30 while the fetch is in flight the cover says Studio is fetching: "
    + g2Line(ok) + (cover.length ? "; cover " + JSON.stringify(cover) : "") + "; said " + JSON.stringify(box.said.slice(-3)));
};

/* E4, state 2. An hour of empty fetches says the licence was not found, on the refusal line and the cover,
   and the shell hands that step. */
LEGS.g2s31 = async () => {
  const box = await revokedLead("g2s31", { fetchGrant: async () => {} });
  const ok = { said: false, row: false, cover: false, shell: false, words: false };
  const cover = [];
  let shell = null;
  try {
    await box.sync();
    box.s.t.answer = helloRevoked;
    box.jump(26 * 60 * 1000);
    await box.sync();
    box.jump(61 * 60 * 1000);
    await box.sync();
    ok.said = box.said.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_NONE_EN) >= 0;
    const row = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.row = !!row && row.revoked === true && row.revokedNone === true;
    cover.push.apply(cover, await revokedCover("revoked-none", REVOKED_NONE_EN, REVOKED_NONE_PL));
    ok.cover = cover.length === 0;
    ok.words = Relay.REVOKED_NONE === REVOKED_NONE_EN;
    await box.s.runner.stop();
    box.s.t.down = true;
    shell = await loadStudioShell(box.s.ud, { relay: box.s.t, env: SHELL_ENV(box.s), thread: SHELL_THREAD });
    const lic = await shell.ask("studio:licence");
    ok.shell = !!lic && Array.isArray(lic.relayTeams) && lic.relayTeams.some((t) => t.team === box.s.teamId && t.step === "revoked-none");
  } finally {
    try { await box.s.runner.stop(); } catch { /* already stopped */ }
    if (shell) { try { await shell.done(); } catch { /* the shell is already down */ } }
  }
  check(Object.values(ok).every((v) => v === true), "g2s31 an hour of empty fetches says the licence was not found, on the cover: "
    + g2Line(ok) + (cover.length ? "; cover " + JSON.stringify(cover) : "") + "; said " + JSON.stringify(box.said.slice(-3)));
};

/* E4. Check now moves the nothing-found sentence back to fetching while the check runs, and a check that finds nothing returns it. */
LEGS.g2s32 = async () => {
  const box = await revokedLead("g2s32");
  const seen = { during: null };
  const ok = { before: false, during: false, after: false };
  let shell = null;
  const fake = {
    request: async (method, url) => {
      const u = String(url);
      if (u.indexOf("/licence/") >= 0) {
        const row = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
        seen.during = !!(row && row.revokedNone === true);
        return { status: 503, bytes: Buffer.from("{}"), header: () => null };
      }
      throw new Error("the lab's relay does not answer");
    },
    connect: () => null,
  };
  try {
    await box.s.runner.stop();
    const lead = readKeyFile(box.s.keyAt).public;
    fs.writeFileSync(path.join(box.s.ud, "licence-service.json"), JSON.stringify({ by: "email", lead: lead, checked: 1, tried: 1 }, null, 1) + "\n");
    K.markRelay(box.s.teamsFile, box.s.teamId, { revoked: true, revokedNone: true });
    shell = await loadStudioShell(box.s.ud, { relay: fake, env: SHELL_ENV(box.s), thread: SHELL_THREAD });
    const before = await shell.ask("studio:licence");
    const beforeRow = before && Array.isArray(before.relayTeams) ? before.relayTeams.find((t) => t.team === box.s.teamId) : null;
    ok.before = !!beforeRow && beforeRow.step === "revoked-none";
    await shell.ask("studio:licence-check");
    ok.during = seen.during === false;
    const after = await shell.ask("studio:licence");
    const afterRow = after && Array.isArray(after.relayTeams) ? after.relayTeams.find((t) => t.team === box.s.teamId) : null;
    ok.after = !!afterRow && afterRow.step === "revoked-none";
  } finally {
    try { await box.s.runner.stop(); } catch { /* already stopped */ }
    if (shell) { try { await shell.done(); } catch { /* the shell is already down */ } }
  }
  check(Object.values(ok).every((v) => v === true), "g2s32 Check now moves the nothing-found sentence back to fetching, and a check that finds nothing returns it: "
    + g2Line(ok) + "; during " + JSON.stringify(seen.during));
};

/* The test architect's hold 6 (moment 10 of the relay team's life): another key made the team's id before the lead's first create. That
   create's refusal takes the same path as a remake's: the team is marked taken, said once in Claudette's first-create words, nothing
   is posted for it at the next sync, and the page says them, in English and in Polish. */
LEGS.g2s33 = async () => {
  const world = await relayWorld(), lab = labDir("relay-g2s33"), said = [];
  world.R.clock.now = Date.now();
  const s = await studioLead(world, lab, { say: (l) => said.push(l) });
  const Q = keyPair(true), now = world.R.clock.now;
  const squat = await world.admin("POST", "/relay/v1/teams", grantKit.createBody(s.rt, { keyId: Q.keyId, pub: Q.pub }, now,
    (bytes) => crypto.sign(null, bytes, Q.privateKey).toString("hex"), { now }));
  const creates = () => s.t.sent.filter((l) => RR_CREATE.test(l)).length;
  await s.runner.sync(); await s.runner.idle();
  const k = K.relayTeams(s.teamsFile).find((w) => w.team === s.teamId) || null, first = creates();
  await s.runner.sync(); await s.runner.idle();
  await s.runner.stop();
  const row = world.store(s.rt) ? world.store(s.rt).get("team") : null;
  const { loadPage } = await import("./page-stand-in.mjs");
  const page = {};
  for (const lang of ["en", "pl"]) {
    const P = loadPage({ api: {}, uiLang: lang }).page;
    page[lang] = P.lapseSaid ? P.lapseSaid({ team: s.teamId, names: [], step: "taken", first: true, until: null, readOnly: null, swept: null }) : "";
  }
  const ok = { squatted: squat.status === 200, stillTheirs: !!row && row.lead.keyId === Q.keyId, kept: !!k && k.taken === true && k.takenFirst === true,
    said: said.some((l) => l === "relay of team " + s.teamId + ": " + Relay.TAKEN_SAID_FIRST), notReposted: first === 1 && creates() === 1,
    pageWords: page.en === "This team could not be set up on the relay: its place there is already held by another key. Make the team again, which gives it a new place, and invite its teammates. Nothing on the team's computers or in Studio has been deleted."
      && page.pl === "Nie udało się założyć tego zespołu na przekaźniku: jego miejsce zajmuje już tam inny klucz. Trzeba utworzyć zespół od nowa, co da mu nowe miejsce, i zaprosić członków zespołu. Z komputerów zespołu i ze Studia nic nie zostało usunięte." };
  check(Object.values(ok).every((v) => v === true), "g2s33 a first create refused because another key holds the team's id is taken, said and left: " + g2Line(ok)
    + "; creates " + first + " then " + creates());
};

/* Stands for the relay without the tombstone (as the live Worker still runs, before pin 9a817191):
   after the sweep another key's create on the swept id succeeds, and the lead's renewal and probe meet it.
   The lead's renewal is refused; Studio says the place is taken in Claudette's words, keeps that,
   and posts nothing for the team at the next sync. Goes when the live Worker moves. */
LEGS.g2s34 = async () => {
  const r = await rrScene("g2s34", { renew: true, squat: true, oldRelay: true });
  const row = r.world.store(r.s.rt) ? r.world.store(r.s.rt).get("team") : null, k = r.kept();
  const ok = { squatted: !!r.squatMade && r.squatMade.status === 200, stillTheirs: !!row && row.lead.keyId === r.squatter.keyId,
    kept: !!k && k.taken === true, said: r.said.some((l) => l === "relay of team " + r.s.teamId + ": " + Relay.TAKEN_SAID),
    notReposted: !!r.firstPosts && r.grantPosts() === r.firstPosts.grants && r.creates() === r.firstPosts.creates };
  check(Object.values(ok).every((v) => v === true), "g2s34 a team whose swept id another key took is refused, said as taken, and not posted again: " + g2Line(ok)
    + "; grant posts " + (r.firstPosts && r.firstPosts.grants) + " then " + r.grantPosts() + ", creates " + (r.firstPosts && r.firstPosts.creates) + " then " + r.creates());
};

/* A link the relay has registered says it is ready. One copied before that says it is still on its way. Both go through invite-copy and do-invite. */
LEGS.g2s35 = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const Studio = await import("../src/studio.mjs");
  const lab = labDir("relay-g2s35");
  const born = await Studio.newProject(lab, "Harbour Lamps", ["en"]);
  const dir = born && born.dir ? born.dir : born;
  const open = JSON.parse(JSON.stringify(await Studio.openProject(dir)));
  const WAY_EN = "The link is copied. It reaches the relay shortly, usually within a minute, and a teammate can use it from then on.";
  const WAY_PL = "Odnośnik jest skopiowany. Wkrótce dotrze do przekaźnika, zwykle w ciągu minuty, i od tej chwili można z niego skorzystać.";
  const READY_EN = "The link is on the clipboard. Send it through your organisation's own mail or chat.";
  const READY_PL = "Odnośnik jest w schowku; można go wysłać pocztą lub czatem organizacji.";
  const inviteId = "0123456789abcdef";
  const screenOf = (registered) => ({ error: null, folder: dir, id: "harbour-lamps", mark: null, signing: "studio-harbour", file: "ours",
    reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, requests: [], autoAdmit: false, keyOpens: true,
    inviteName: "Mira Lantern", invited: inviteId,
    invites: [{ id: inviteId, name: "Mira Lantern", person: "Piotr Quay", made: "2026-10-13T08:00:00.000Z", expires: "2026-10-20T08:00:00.000Z",
      code: "04913", relay: true, registered: registered === true, used: null, deskName: "" }],
    team: { id: "t-0123456789abcdef", epoch: 1, relay: true, sealed: true, lists: true, exportsSealed: true, roster: [], recovery: false, leadPrint: "abcd" } });
  const noteOf = async (lang, source, registered) => {
    const flag = registered === true;
    const api = {
      desks: async () => JSON.parse(JSON.stringify(screenOf(flag))),
      inviteMake: async () => JSON.parse(JSON.stringify(screenOf(flag))),
      inviteCopy: async (...a) => JSON.parse(JSON.stringify(Object.assign(screenOf(flag), { copied: a[1], as: "link" }))),
    };
    const home = loadPage(Object.assign({ api, uiLang: lang }, source ? { source } : {}));
    Object.assign(home.page.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en", cover: null, teamWant: "" });
    await home.page.desksLoad();
    await home.page.ACTS["invite-copy"]({ getAttribute: () => inviteId });
    const copied = (home.page.S.dkNote || []).join("\n");
    home.page.S.cover = "team";
    home.page.S.teamWant = "invite";
    await home.page.ACTS["do-invite"]();
    const made = (home.page.S.dkNote || []).join("\n");
    return { copied, made };
  };
  const holds = (note, want, other) => note.copied.indexOf(want) >= 0 && note.copied.indexOf(other) < 0
    && note.made.indexOf(want) >= 0 && note.made.indexOf(other) < 0;
  try {
    const enWay = await noteOf("en", null, false), plWay = await noteOf("pl", null, false);
    const enReady = await noteOf("en", null, true), plReady = await noteOf("pl", null, true);
    const wayOk = holds(enWay, WAY_EN, READY_EN) && holds(plWay, WAY_PL, READY_PL);
    const readyOk = holds(enReady, READY_EN, WAY_EN) && holds(plReady, READY_PL, WAY_PL);
    check(wayOk && readyOk, "g2s35 a registered link says it is ready and an unregistered one says it is on its way, in English and in Polish: "
      + (wayOk && readyOk ? "said" : "not said")
      + " way " + JSON.stringify({ en: enWay, pl: plWay }) + " ready " + JSON.stringify({ en: enReady, pl: plReady }));
    /* The lift below is proof, not a gate: under ETIUDA_PLANTS=off it is skipped and counted as skipped. */
    if (process.env.ETIUDA_PLANTS === "off") liftsSkipped++;
    else {
    const appFile = path.join(ROOT, "ui", "app.js");
    const before = fs.readFileSync(appFile);
    const lines = before.toString("utf8").split(/\n/);
    const at = lines.findIndex((l) => l.indexOf("plant:h35-on-way") >= 0);
    let ready = false, said = "plant line absent";
    if (at >= 0) {
      lines[at] = "    if (relay) return T(\"The link is on the clipboard. Send it through your organisation's own mail or chat.\");";
      const liftedEn = await noteOf("en", lines.join("\n")), liftedPl = await noteOf("pl", lines.join("\n"));
      ready = liftedEn.copied.indexOf(READY_EN) >= 0 && liftedEn.copied.indexOf(WAY_EN) < 0 && liftedEn.made.indexOf(READY_EN) >= 0
        && liftedPl.copied.indexOf(READY_PL) >= 0 && liftedPl.copied.indexOf(WAY_PL) < 0 && liftedPl.made.indexOf(READY_PL) >= 0;
      said = ready ? "the lifted page said the ready sentence" : " en " + JSON.stringify(liftedEn) + " pl " + JSON.stringify(liftedPl);
    }
    const same = fs.readFileSync(appFile).equals(before);
    check(ready && same, "g2s35 lifting plant:h35-on-way says the link is ready before the relay has it"
      + " (FAIL g2s35 a registered link says it is ready and an unregistered one says it is on its way, in English and in Polish: not said,"
      + " the ready sentence was shown): " + said + ", sha " + (same ? "restored" : "differs"));
    }
  } catch (e) {
    check(false, "g2s35 threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 4).join(" / ") : e));
  }
};

/* An empty first fetch says the fetching sentence and not REVOKED_NONE, and the row is not yet none-found. */
LEGS.g2s36 = async () => {
  const box = await revokedLead("g2s36", { fetchGrant: async () => {} });
  const ok = { saidFetching: false, notNone: false, row: false, cover: false };
  const cover = [];
  try {
    await box.sync();
    box.s.t.answer = helloRevoked;
    box.jump(26 * 60 * 1000);
    await box.sync();
    ok.saidFetching = box.said.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_FETCH_EN) >= 0;
    ok.notNone = box.said.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_NONE_EN) < 0;
    const row = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.row = !!row && row.revoked === true && row.revokedNone !== true;
    cover.push.apply(cover, await revokedCover("revoked", REVOKED_FETCH_EN, REVOKED_FETCH_PL));
    ok.cover = cover.length === 0;
  } finally {
    try { await box.s.runner.stop(); } catch { /* already stopped */ }
  }
  check(Object.values(ok).every((v) => v === true), "g2s36 an empty first fetch says the fetching sentence and not REVOKED_NONE: "
    + g2Line(ok) + (cover.length ? "; cover " + JSON.stringify(cover) : "") + "; said " + JSON.stringify(box.said.slice(-3)));
};

/* A second fetch comes within the hour and, when it finds a grant, posts it, clearing the revoked mark. */
LEGS.g2s37 = async () => {
  let calls = 0;
  const signer = secondGrantSigner(Date.now());
  let sRef = null;
  const fetchGrant = async () => {
    calls++;
    if (calls === 2 && sRef) {
      const held = JSON.parse(fs.readFileSync(path.join(sRef.ud, "relay-grant.json"), "utf8"));
      const fresh = grantKit.grantFor(readKeyFile(sRef.keyAt).public, Date.now(), {
        via: signer.via, signer: { id: signer.id, privateKey: signer.privateKey }, keyId: signer.id,
        fields: { until: held.until, issued: held.issued, paid: true }
      });
      fs.writeFileSync(path.join(sRef.ud, "relay-grant.json"), JSON.stringify(fresh, null, 1) + "\n");
    }
  };
  const box = await revokedLead("g2s37", { fetchGrant });
  sRef = box.s;
  const ok = { firstFetch: false, secondFetch: false, posted: false, cleared: false, notNone: false };
  try {
    await box.sync();
    revokeOnLab(box.world, [grantKit.DELEGATE.pub]);
    box.s.t.answer = helloRevoked;
    box.jump(26 * 60 * 1000);
    await box.sync();
    ok.firstFetch = calls === 1;
    const rowDuring = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    const duringOk = !!rowDuring && rowDuring.revoked === true && rowDuring.revokedNone !== true;
    box.jump(10 * 60 * 1000);
    await box.sync();
    ok.secondFetch = calls === 2;
    ok.posted = grantPubsOf(box.s.t).indexOf(signer.pub) >= 0;
    const rowAfter = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.cleared = duringOk && !!rowAfter && rowAfter.revoked === false && rowAfter.grantKey === signer.pub;
    ok.notNone = box.said.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_NONE_EN) < 0;
  } finally {
    try { await box.s.runner.stop(); } catch { /* already stopped */ }
  }
  check(Object.values(ok).every((v) => v === true), "g2s37 a second fetch comes within the hour and, when it finds a grant, posts it: "
    + g2Line(ok) + "; calls " + calls + "; pubs " + JSON.stringify(grantPubsOf(box.s.t)));
};

/* An hour of empty fetches ends on REVOKED_NONE and marks the team revoked-none. */
LEGS.g2s38 = async () => {
  let calls = 0;
  const box = await revokedLead("g2s38", { fetchGrant: async () => { calls++; } });
  const ok = { firstFetch: false, firstNotNone: false, hourSaid: false, row: false, cover: false, retried: false };
  const cover = [];
  try {
    await box.sync();
    box.s.t.answer = helloRevoked;
    box.jump(26 * 60 * 1000);
    await box.sync();
    ok.firstFetch = calls === 1;
    const rowFirst = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.firstNotNone = !!rowFirst && rowFirst.revoked === true && rowFirst.revokedNone !== true
      && box.said.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_NONE_EN) < 0;
    box.jump(61 * 60 * 1000);
    await box.sync();
    ok.retried = calls >= 2;
    ok.hourSaid = box.said.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_NONE_EN) >= 0;
    const rowHour = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.row = !!rowHour && rowHour.revoked === true && rowHour.revokedNone === true;
    cover.push.apply(cover, await revokedCover("revoked-none", REVOKED_NONE_EN, REVOKED_NONE_PL));
    ok.cover = cover.length === 0;
  } finally {
    try { await box.s.runner.stop(); } catch { /* already stopped */ }
  }
  check(Object.values(ok).every((v) => v === true), "g2s38 an hour of empty fetches ends on REVOKED_NONE: "
    + g2Line(ok) + (cover.length ? "; cover " + JSON.stringify(cover) : "") + "; calls " + calls);
};

/* Check now on a revoked team, within the hour: its fetch finds nothing, so the lead is told so at once, not "nothing needs doing
   here" again (the test architect's E1 on revoked-retry; Argon's 8.2). */
LEGS.g2s39 = async () => {
  let calls = 0;
  const box = await revokedLead("g2s39", { fetchGrant: async () => { calls++; } });
  const ok = { fetching: false, checked: false, none: false, row: false };
  try {
    await box.sync();
    box.s.t.answer = helloRevoked;
    box.jump(26 * 60 * 1000);
    await box.sync();
    ok.fetching = box.said.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_NONE_EN) < 0;
    const before = calls;
    box.jump(60 * 1000);
    await box.s.runner.sync({ askTaken: true }); await box.s.runner.idle();
    ok.checked = calls === before + 1;
    ok.none = box.said.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_NONE_EN) >= 0;
    const row = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.row = !!row && row.revoked === true && row.revokedNone === true;
  } finally {
    try { await box.s.runner.stop(); } catch { /* already stopped */ }
  }
  check(Object.values(ok).every((v) => v === true), "g2s39 Check now on a revoked team whose fetch finds nothing ends on REVOKED_NONE: "
    + g2Line(ok) + "; calls " + calls + "; said " + JSON.stringify(box.said.slice(-2)));
};

/* g2s40: after the hour, the automatic fetch slows to hourly, not every five minutes for good; Check now still fetches at once. */
LEGS.g2s40 = async () => {
  let calls = 0;
  const box = await revokedLead("g2s40", { fetchGrant: async () => { calls++; } });
  const ok = { firstFetch: false, hourFetch: false, slowed: false, checkNow: false };
  try {
    await box.sync();
    box.s.t.answer = helloRevoked;
    box.jump(26 * 60 * 1000);
    await box.sync();
    ok.firstFetch = calls === 1;
    box.jump(61 * 60 * 1000);
    await box.sync();
    ok.hourFetch = calls === 2;
    box.jump(5 * 60 * 1000);
    await box.sync();
    ok.slowed = calls === 2;
    box.jump(60 * 1000);
    await box.s.runner.sync({ askTaken: true }); await box.s.runner.idle();
    ok.checkNow = calls === 3;
  } finally {
    try { await box.s.runner.stop(); } catch { /* already stopped */ }
  }
  check(Object.values(ok).every((v) => v === true), "g2s40 after the hour automatic fetch slows to hourly and Check now fetches at once: "
    + g2Line(ok) + "; calls " + calls);
};

/* g2s41: a Studio restarted after REVOKED_NONE shows REVOKED_NONE at once, not "fetching" for another hour. */
LEGS.g2s41 = async () => {
  let calls = 0;
  const box = await revokedLead("g2s41", { fetchGrant: async () => { calls++; } });
  const ok = { noneFirst: false, restartedNone: false, rowNone: false, notFetching: false };
  let runner2 = null;
  try {
    await box.sync();
    box.s.t.answer = helloRevoked;
    box.jump(26 * 60 * 1000);
    await box.sync();
    box.jump(61 * 60 * 1000);
    await box.sync();
    ok.noneFirst = box.said.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_NONE_EN) >= 0;
    await box.s.runner.stop();
    const said2 = [];
    runner2 = trackRunner({ roots: GRANT_ROOTS, teamsFile: box.s.teamsFile, vault: box.s.vault, keyFile: box.s.keyAt,
      secret: () => labSecret(box.s.keyAt), request: box.s.t.request, connect: box.s.t.connect, watch: false, pollMs: 1e9,
      clock: () => box.now, say: (l) => said2.push(l), fetchGrant: async () => { calls++; } });
    await runner2.sync(); await runner2.idle();
    ok.restartedNone = said2.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_NONE_EN) >= 0;
    ok.notFetching = said2.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_FETCH_EN) < 0;
    const row = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.rowNone = !!row && row.revoked === true && row.revokedNone === true;
  } finally {
    try { await box.s.runner.stop(); } catch { }
    if (runner2) try { await runner2.stop(); } catch { }
  }
  check(Object.values(ok).every((v) => v === true), "g2s41 a Studio restarted after REVOKED_NONE shows REVOKED_NONE at once: "
    + g2Line(ok) + "; calls " + calls);
};

/* g2s42: a second revocation (a new avoided key) starts its own hour, not the first one's; remake clears tracking. */
LEGS.g2s42 = async () => {
  let calls = 0;
  const box = await revokedLead("g2s42", { fetchGrant: async () => { calls++; } });
  const ok = { firstHourEnd: false, recovered: false, secondRevokedFetching: false, secondRevokedNotNone: false, rowFetching: false };
  try {
    await box.sync();
    box.s.t.answer = helloRevoked;
    box.jump(26 * 60 * 1000);
    await box.sync();
    box.jump(61 * 60 * 1000);
    await box.sync();
    ok.firstHourEnd = box.said.indexOf("relay of team " + box.s.teamId + ": " + REVOKED_NONE_EN) >= 0;
    /* Recovery: hello returns 200, acceptRevoked calls clearRevokedTracking */
    box.s.t.answer = null;
    box.jump(10 * 60 * 1000);
    await box.sync();
    const rowRecovered = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.recovered = !!rowRecovered && rowRecovered.revoked === false && rowRecovered.revokedNone === false;
    /* Second revocation starts its own hour */
    box.s.t.answer = (m, u) => {
      if (/\/hello$/.test(String(u)) || /\/since\//.test(String(u)))
        return { status: 403, bytes: Buffer.from(JSON.stringify({ error: "revoked" })) };
      return null;
    };
    box.jump(10 * 60 * 1000);
    box.s.chan().kick();
    await box.sync();
    const saidAfter = box.said.slice();
    ok.secondRevokedFetching = saidAfter.filter((l) => l.indexOf(REVOKED_FETCH_EN) >= 0).length >= 2;
    ok.secondRevokedNotNone = saidAfter.filter((l) => l.indexOf(REVOKED_NONE_EN) >= 0).length === 1;
    const rowSecond = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.rowFetching = !!rowSecond && rowSecond.revoked === true && rowSecond.revokedNone !== true;
  } finally {
    try { await box.s.runner.stop(); } catch { }
  }
  check(Object.values(ok).every((v) => v === true), "g2s42 a second revocation starts its own hour: "
    + g2Line(ok) + "; calls " + calls);
};

/* g2s43: after meetRevoked posts a replacement grant, the call that met revoked is made once more in the same sync. The lab relay is
   told the kit's delegate is revoked, as the live relay is, so it takes the replacement from another key (relay core 4cd12b27). */
LEGS.g2s43 = async () => {
  const signer = secondGrantSigner(Date.now());
  const box = await revokedLead("g2s43", {
    fetchGrant: async () => {
      const held = JSON.parse(fs.readFileSync(path.join(box.s.ud, "relay-grant.json"), "utf8"));
      const fresh = grantKit.grantFor(readKeyFile(box.s.keyAt).public, Date.now(), {
        via: signer.via, signer: { id: signer.id, privateKey: signer.privateKey }, keyId: signer.id,
        fields: { until: held.until, issued: held.issued, paid: true }
      });
      fs.writeFileSync(path.join(box.s.ud, "relay-grant.json"), JSON.stringify(fresh, null, 1) + "\n");
    }
  });
  const ok = { retried: false, statusOk: false, grantPosted: false };
  try {
    await box.sync();
    revokeOnLab(box.world, [grantKit.DELEGATE.pub]);
    let firstCall = true;
    box.s.t.answer = (method, url) => {
      if (firstCall && method === "POST" && String(url).endsWith("/hello")) {
        firstCall = false;
        return { status: 403, bytes: Buffer.from(JSON.stringify({ error: "revoked" })), header: () => null };
      }
      return null;
    };
    const res = await box.s.runner.request("POST", Relay.RELAY_URL + "/t/" + box.s.rt + "/hello", { "content-type": "application/json" }, Buffer.from("{}"));
    ok.retried = firstCall === false;
    ok.grantPosted = grantPubsOf(box.s.t).indexOf(signer.pub) >= 0;
    ok.statusOk = res && res.status === 200;
  } finally {
    try { await box.s.runner.stop(); } catch { }
  }
  check(Object.values(ok).every((v) => v === true), "g2s43 call meeting revoked is retried once more in the same sync after grant replacement: "
    + g2Line(ok));
};

/* g2s44: a team is never made under a grant whose signer is on the kept revoked list; leads to fetch. */
LEGS.g2s44 = async () => {
  const world = await relayWorld(), lab = labDir("relay-g2s44");
  const ud = path.join(lab, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const keyAt = path.join(ud, "signing-key.json");
  const lead = await labLeadKey();
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  const signer = secondGrantSigner(Date.now());
  const revokedGrant = grantKit.grantFor(lead.public, Date.now(), {
    via: signer.via, signer: { id: signer.id, privateKey: signer.privateKey }, keyId: signer.id,
    fields: { until: Date.now() + 30 * 86400000, paid: true }
  });
  fs.writeFileSync(path.join(ud, "relay-grant.json"), JSON.stringify(revokedGrant, null, 1) + "\n");
  const teamsFile = K.teamsFile(ud), vault = makeVault(), rt = Relay.relayId(), teamId = "t-" + hex(8);
  K.keepTeamKey(teamsFile, vault, teamId, 1, crypto.randomBytes(32));
  const mirror = K.keepRelay(teamsFile, teamId, rt, Relay.RELAY_URL);
  let fetchCalls = 0;
  const t = world.transport("lead");
  const said = [];
  const runner = trackRunner({ roots: GRANT_ROOTS, teamsFile, vault, keyFile: keyAt, secret: () => labSecret(keyAt),
    request: t.request, connect: t.connect, watch: false, pollMs: 1e9, clock: () => Date.now(),
    revokedKeys: () => [signer.pub], fetchGrant: async () => { fetchCalls++; },
    say: (l) => said.push(l) });
  const ok = { refused: false, noCreateSent: false, fetched: false, saidRevoked: false };
  try {
    await runner.sync(); await runner.idle();
    const posts = t.log.filter((l) => l.indexOf("POST /teams") >= 0 || l.indexOf("POST teams") >= 0);
    ok.noCreateSent = posts.length === 0;
    const row = K.relayTeams(teamsFile).find((w) => w.team === teamId);
    ok.refused = !!row && row.created !== true && row.revoked === true;
    ok.fetched = fetchCalls >= 1;
    ok.saidRevoked = said.some((l) => l.indexOf(REVOKED_FETCH_EN) >= 0);
  } finally {
    try { await runner.stop(); } catch { }
  }
  check(Object.values(ok).every((v) => v === true), "g2s44 team never made under revoked signer, leads to fetch: "
    + g2Line(ok) + "; posts " + t.log.join(", "));
};

/* g2s45: cancelling an unused invitation goes through the same path as every other relay call, reaching meetRevoked. */
LEGS.g2s45 = async () => {
  const world = await relayWorld(), lab = labDir("relay-g2s45");
  const S = await shellLead(world, lab, { invitations: ["Piotr Quay"] });
  const ok = { settled: false, callFailed: false, revokedMarked: false };
  try {
    ok.settled = await until(() => S.registered() && S.heard(), 20000);
    S.t.answer = (method, url) => {
      if (method === "POST" && (String(url).endsWith("/invites") || String(url).endsWith("/grant"))) {
        return { status: 403, bytes: Buffer.from(JSON.stringify({ error: "revoked" })), header: () => null };
      }
      return null;
    };
    try {
      const res = await S.cancel(S.inv[0], false);
      if (res && res.error) ok.callFailed = true;
    } catch {
      ok.callFailed = true;
    }
    const row = K.relayTeams(S.teamsFile).find((w) => w.team === S.teamId);
    ok.revokedMarked = !!row && row.revoked === true;
  } finally {
    await S.shell.done();
  }
  check(Object.values(ok).every((v) => v === true), "g2s45 cancelling unused invitation reaches meetRevoked on revoked answer: "
    + g2Line(ok));
};

/* A grant of the same end under another key is not taken by a repeat create: the relay answers the renewal bad-grant and the
   probe 200, and keeps the key it held. The record keeps that key. A told lapse set earlier than the grant is what makes
   this one owed, so the probe runs; it is put back before the revocation, and the same-end grant is not owed again. Once
   the key in force is revoked, the recovery posts the grant and a hello is accepted. */
LEGS.g2s46 = async () => {
  const box = await revokedLead("g2s46");
  const signer = secondGrantSigner(Date.now());
  const k1 = grantKit.DELEGATE.pub;
  const relayKey = () => { const s = box.world.store(box.s.rt); return s ? s.get("grantKey") : ""; };
  const creates = () => box.s.t.sent.filter((l) => RR_CREATE.test(l)).length;
  const ok = { made: false, probed: false, relayHeld: false, kept: false, owedQuiet: false, posted: false, hello: false, took: false };
  let tail = [];
  try {
    await box.sync();
    const row0 = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.made = !!row0 && row0.grantKey === k1 && relayKey() === k1;
    const held = JSON.parse(fs.readFileSync(path.join(box.s.ud, "relay-grant.json"), "utf8"));
    const fresh = grantKit.grantFor(readKeyFile(box.s.keyAt).public, Date.now(), {
      via: signer.via, signer: { id: signer.id, privateKey: signer.privateKey }, keyId: signer.id,
      fields: { until: held.until, issued: held.issued, paid: held.paid === true }
    });
    fs.writeFileSync(path.join(box.s.ud, "relay-grant.json"), JSON.stringify(fresh, null, 1) + "\n");
    const savedLapse = row0 && row0.lapse ? Object.assign({}, row0.lapse) : null;
    const behindUntil = held.until - 24 * 60 * 60 * 1000;
    const behind = savedLapse ? Object.assign({}, savedLapse, { until: behindUntil })
      : { state: "working", until: behindUntil, readOnly: null, swept: held.until, at: Date.now() };
    K.markRelay(box.s.teamsFile, box.s.teamId, { lapse: behind });
    const beforeCreates = creates();
    await box.sync();
    const row1 = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.probed = creates() === beforeCreates + 1;
    ok.relayHeld = relayKey() === k1;
    ok.kept = !!row1 && row1.grantKey === k1 && !!row1.granted && row1.granted.until === held.until && row1.granted.paid === (held.paid === true);
    K.markRelay(box.s.teamsFile, box.s.teamId, { lapse: savedLapse });
    const quiet = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.owedQuiet = Relay.owesGrant(quiet, fresh) === false;
    revokeOnLab(box.world, [k1]);
    const from = box.s.t.log.length;
    box.jump(26 * 60 * 1000);
    await box.sync();
    const slice = box.s.t.log.slice(from);
    const helloAt = slice.findIndex((l) => l === "POST hello");
    const grantAt = slice.findIndex((l) => l === "POST grant");
    ok.posted = grantPubsOf(box.s.t).indexOf(signer.pub) >= 0 && helloAt >= 0 && grantAt > helloAt;
    const res = await box.s.runner.request("POST", Relay.RELAY_URL + "/t/" + box.s.rt + "/hello", { "content-type": "application/json" }, Buffer.from("{}"));
    ok.hello = !!res && res.status === 200;
    const row2 = K.relayTeams(box.s.teamsFile).find((w) => w.team === box.s.teamId);
    ok.took = relayKey() === signer.pub && !!row2 && row2.grantKey === signer.pub && row2.revoked === false;
    tail = slice;
  } finally { try { await box.s.runner.stop(); } catch { /* already stopped */ } }
  check(Object.values(ok).every((v) => v === true), "g2s46 a same-end grant is refused, the probe answers 200, and the record keeps the key in force; once that key is revoked the recovery posts the new grant and a hello is accepted: "
    + g2Line(ok) + "; log " + JSON.stringify(tail));
};

/* Board 974, maturity 10 part 2. A swept team, the grant on disk signed by a key the relay has revoked: the pass that
   fetches a postable grant makes the space again then, and does not leave it for the next sync. */
LEGS["974m10"] = async () => {
  const DAY = 24 * 60 * 60 * 1000;
  let fetched = 0;
  let signer = null;
  const box = await revokedLead("974m10", {
    fetchGrant: async () => {
      fetched++;
      const now = box.world.R.clock.now;
      const fresh = grantKit.grantFor(readKeyFile(box.s.keyAt).public, now, {
        via: signer.via, signer: { id: signer.id, privateKey: signer.privateKey }, keyId: signer.id,
        fields: { until: now + 30 * grantKit.DAY, issued: now - grantKit.HOUR, paid: true }
      });
      fs.writeFileSync(path.join(box.s.ud, "relay-grant.json"), JSON.stringify(fresh, null, 1) + "\n");
    }
  });
  const store = () => box.world.store(box.s.rt);
  const teamRow = () => { const st = store(); return st ? st.get("team") : null; };
  const sweptMark = () => { const st = store(); return st ? st.get("swept") : null; };
  const ok = { made: false, swept: false, fetched: false, back: false };
  try {
    await box.sync();
    ok.made = !!teamRow();
    const jumped = box.jump(121 * DAY);
    await box.sync();
    await box.sync();
    ok.swept = !teamRow() && sweptMark() === box.s.lead.public;
    signer = secondGrantSigner(jumped);
    const bad = grantKit.grantFor(readKeyFile(box.s.keyAt).public, jumped, {
      via: grantKit.delegationFor(jumped), signer: grantKit.DELEGATE, keyId: grantKit.DELEGATE.id,
      fields: { until: jumped + 30 * grantKit.DAY, issued: jumped - grantKit.HOUR, paid: true }
    });
    fs.writeFileSync(path.join(box.s.ud, "relay-grant.json"), JSON.stringify(bad, null, 1) + "\n");
    revokeOnLab(box.world, [grantKit.DELEGATE.pub]);
    await box.sync();
    ok.fetched = fetched >= 1;
    const row = teamRow();
    ok.back = !!row && row.lead && row.lead.keyId === box.s.lead.keyId;
  } finally { try { await box.s.runner.stop(); } catch { /* already stopped */ } }
  check(ok.made && ok.swept && ok.fetched && ok.back,
    "974m10 a swept team whose grant was signed by a revoked key is made again in the pass that first holds a postable grant: "
    + JSON.stringify(ok));
};

/* The page says a taken place in Claudette's words, in English and in Polish: with the renewal on the Licence cover and in the notice,
   and without it on the team's Desks screen. */
LEGS.g2s21 = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const want = { en: ["The licence is renewed, but this team could not be brought back to the relay: since its copy was deleted, its place there has been taken by another key. To carry on through the relay, make the team again and invite its teammates anew. Nothing on the team's computers or in Studio has been deleted.", "This team could not be brought back to the relay: since its copy was deleted, its place there has been taken by another key. To carry on through the relay, make the team again and invite its teammates anew. Nothing on the team's computers or in Studio has been deleted."],
    pl: ["Licencja jest odnowiona, ale tego zespołu nie udało się przywrócić na przekaźnik: od czasu usunięcia jego kopii jego miejsce zajął tam inny klucz. Aby dalej korzystać z przekaźnika, trzeba utworzyć zespół od nowa i ponownie zaprosić członków zespołu. Z komputerów zespołu i ze Studia nic nie zostało usunięte.", "Tego zespołu nie udało się przywrócić na przekaźnik: od czasu usunięcia jego kopii jego miejsce zajął tam inny klucz. Aby dalej korzystać z przekaźnika, trzeba utworzyć zespół od nowa i ponownie zaprosić członków zespołu. Z komputerów zespołu i ze Studia nic nie zostało usunięte."] };
  const enc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const bad = [];
  for (const lang of ["en", "pl"]) {
    const x = { team: "t-0011223344556677", names: ["Lantern Quay"], step: "taken", until: null, readOnly: null, swept: null };
    const answers = [{ due: [x], teams: [x] }];
    const home = loadPage({ api: { relayLapse: async () => answers.shift() || { due: [], teams: [x] }, licence: async () => ({}) }, uiLang: lang }), P = home.page;
    Object.assign(P.S, { open: { dir: "C:/quay", draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [], project: { rev: 0 },
      counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } }, host: { tour: { offered: true } }, err: null, dkNote: null, q: "" });
    P.S.lic = { licence: { status: "active" }, grant: null, relayTeams: [x] };
    if (String(P.licenceCoverHtml()).indexOf(enc(want[lang][0])) < 0) bad.push(lang + " licence cover");
    P.S.cover = null;
    await P.relayLapseAsk();
    if (!(P.S.cover === "relay-lapse" && String(P.relayLapseCoverHtml()).indexOf(enc(want[lang][0])) >= 0)) bad.push(lang + " notice");
    P.ACTS["cover-close"]();
    Object.assign(P.S, { screen: "projects", home: "team", teamDir: "C:/quay", cover: null,
      desks: { team: { id: x.team, epoch: 1, relay: true, roster: [], sealed: true }, folder: "C:/ud/relay/0123456789abcdef0123456789abcdef", file: "ours", requests: [], lapse: x } });
    P.paintMain();
    const html = home.node("#main").innerHTML;
    if (html.indexOf(enc(want[lang][1])) < 0 || html.indexOf(enc(want[lang][0])) >= 0) bad.push(lang + " desks");
  }
  check(bad.length === 0, "g2s21 a taken place is said in Claudette's words, with the renewal on the Licence cover and in the notice and without it on the Desks screen, in English and in Polish: "
    + (bad.length ? JSON.stringify(bad) : "every part holds"));
};

/* The shell hands a taken place over as a step of its own: due once as a notice, on the Licence cover's list and on the team's Desks reply. */
LEGS.g2s22 = async () => {
  const world = await relayWorld(), lab = labDir("relay-g2s22"), R = await leadAtRest(lab, "Lantern Quay");
  world.R.clock.now = Date.now();
  const t = world.transport("shell");
  const thread = async (verb, ...a) => (verb === "listProjects" ? R.S.listProjects(...a) : R.thread(verb, ...a));
  const shell = await loadStudioShell(R.ud, { relay: t, env: R.env, thread });
  const ok = {};
  try {
    await shell.ask("studio:team-relay", R.proj);
    const rec = () => K.relayTeams(R.teamsFile)[0] || null;
    ok.made = await until(() => !!rec() && !!rec().lapse, 20000);
    K.markRelay(R.teamsFile, rec().team, { taken: true });
    const r = await shell.ask("studio:relay-lapse"), lic = await shell.ask("studio:licence"), desks = await shell.ask("studio:desks", R.proj);
    ok.due = !!r && r.due.length === 1 && r.due[0].step === "taken" && JSON.stringify(r.due[0].names) === JSON.stringify(["Lantern Quay"]);
    ok.cover = !!lic && Array.isArray(lic.relayTeams) && lic.relayTeams.length === 1 && lic.relayTeams[0].step === "taken";
    ok.desks = !!desks && !!desks.lapse && desks.lapse.step === "taken";
  } finally {
    shell.done();
  }
  check(Object.keys(ok).length === 4 && Object.values(ok).every((v) => v === true), "g2s22 the shell hands a taken place over as its own step, to the notice, the Licence cover and the Desks screen: " + g2Line(ok));
};

/* ITEM 10 OF THE TEST ARCHITECT'S TRIAGE (STRANDS), on the lab relay. The old computer: a lead whose key makes the team on the relay
   through the shell's own handler. Its key file is a passphrase copy, which is what a backup copy is, so a copy of it is the team
   key's backup. The new computer: no key, the licence service a stand-in that answers a check for whatever lead the request
   names with a grant the lab's root signs for that lead, as the service's answer is judged (src/licence-client.mjs
   take, under STUDIO_RELAY_ROOT), and the relay the lab's, through the same transport. */
LEGS.rsk10 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsk10"), R = await leadAtRest(lab, "Lantern Quay", false, { passphraseFile: true });
  const LICENCE = "https://etiuda.dev/licence/v1/";
  let rt = "", why = "";
  const t1 = world.transport("old-computer"), old = await loadStudioShell(R.ud, { relay: t1, env: R.env, thread: R.thread });
  try {
    const made = teamRelayHandler(old) ? await old.ask("studio:team-relay", R.proj) : null;
    const rec = K.relayTeams(R.teamsFile)[0] || null;
    rt = rec ? rec.rt : "";
    if (!made || made.error || !rt || !(await until(() => !!world.store(rt) && !!world.store(rt).get("team"), 20000)))
      why = "the old computer did not make its team on the relay: " + JSON.stringify(made && (made.error || made.relay));
  } finally { old.done(); }
  const copy = path.join(lab, "team-key-copy.json");
  fs.copyFileSync(R.keyAt, copy);
  namePassphraseFile(copy);

  const ud = path.join(lab, "ud-new"), keyAt = path.join(ud, "signing-key.json"), teamsFile = K.teamsFile(ud);
  fs.mkdirSync(ud, { recursive: true });
  const t2 = world.transport("new-computer"), licenceCalls = [];
  t2.answer = async (method, url, headers, body) => {
    if (String(url).indexOf(LICENCE) !== 0) return null;
    let asked = null;
    try { asked = JSON.parse(Buffer.from(body || []).toString("utf8")); } catch { asked = null; }
    licenceCalls.push(String(url).slice(LICENCE.length));
    const lead = asked && /^[0-9a-f]{64}$/.test(String(asked.lead || "")) ? asked.lead : "";
    const answer = lead ? { ok: true, grant: grantKit.grantFor(lead, Date.now()) } : { ok: false, reason: "refused" };
    return { status: lead ? 200 : 400, header: () => null, bytes: Buffer.from(JSON.stringify(answer)) };
  };
  const verbs = ["teamFacts", "teamKeyBack", "openProject", "readBackup", "openBackup"];
  const thread = (verb, ...a) => (verbs.includes(verb) ? Promise.resolve().then(() => R.S[verb](...a)) : Promise.resolve({}));
  const env = { STUDIO_PROJECTS: path.join(lab, "projects"), STUDIO_SIGNING_KEY: keyAt, STUDIO_RELAY_ROOT: GRANT_ROOT_PUB, STUDIO_TEST_RESTORE: copy };
  const shell = await loadStudioShell(ud, { relay: t2, env, thread });
  const creates = () => t2.sent.filter((l) => /^POST https:\/\/etiuda\.dev\/relay\/v1\/teams\n/.test(l))
    .map((l) => { try { return JSON.parse(l.slice(l.lastIndexOf("\n") + 1)); } catch { return null; } }).filter(Boolean);
  const pubOf = () => { try { const k = readKeyFile(keyAt); return k ? k.public : ""; } catch { return ""; } };
  const grantNow = () => { try { return JSON.parse(fs.readFileSync(path.join(ud, "relay-grant.json"), "utf8")); } catch { return null; } };
  const relayRec = () => K.relayTeams(teamsFile).find((x) => x.rt === rt) || null;
  try {
    /* Signed in first, as the shell's sign-in leaves licence-service.json, under a key made here, and Check now: the project opened
       keeps its relay team, whose create under that key the relay refuses, its space being the team key's. */
    const signInWith = async (pub) => {
      fs.writeFileSync(path.join(ud, "licence-service.json"), JSON.stringify({ by: "signin", provider: "microsoft", lead: pub, checked: 0, tried: 0 }) + "\n");
      return shell.ask("studio:licence-check");
    };
    const made0 = !why ? await shell.ask("studio:key-make") : null;
    const madeKey = pubOf();
    const act = !why && madeKey ? await signInWith(madeKey) : null;
    if (!why && (!made0 || made0.error || !act || act.error || !madeKey || madeKey === R.made.public)) why = "the key made here did not sign in: " + JSON.stringify((made0 && made0.error) || (act && act.error));
    if (!why) await shell.ask("studio:open", R.proj);
    const posted = !why && await until(() => creates().some((c) => c.lead && c.lead.pub === madeKey) && !!relayRec(), 20000);
    const said = posted && await until(() => shell.said.some((l) => /relay of team|relay could not/.test(l)), 25000);
    const refusedFirst = posted && said;
    const before = { refused: !!refusedFirst && !!relayRec() && relayRec().created === false,
      posted: !!posted, said: !!said,
      byActivation: creates().filter((c) => c.lead && c.lead.pub === madeKey).length };
    check(!why && before.refused && before.byActivation >= 1 && world.store(rt).get("team").lead.pub === R.made.public,
      "rsk10a CONTROL: on the new computer, signed in first and the project opened, the create Studio posts under the key made here"
      + " and its grant is refused by the relay, whose space for the team is the team key's: " + JSON.stringify(before) + (why ? ": " + why : ""));

    /* The team key's backup copy restored: in place, nothing sent for it until the lead signs in with it; then the grant follows
       and the relay's create is accepted. */
    const pick = !why ? await shell.ask("studio:key-restore-pick", "t", "k") : null;
    const back = pick ? await shell.ask("studio:key-restore", pick.file, PASS) : null;
    const inPlace = !!back && !back.error && pubOf() === R.made.public;
    const callsAtRestore = licenceCalls.length;
    if (inPlace) await shell.ask("studio:licence-check");
    const waited = inPlace && licenceCalls.length === callsAtRestore && !(grantNow() && grantNow().lead === R.made.public);
    if (inPlace) await signInWith(R.made.public);
    const granted = waited && await until(() => { const g = grantNow(); return !!g && g.lead === R.made.public; }, 10000);
    const accepted = granted && await until(() => !!relayRec() && relayRec().created === true, 20000);
    const last = creates().filter((c) => c.lead && c.lead.pub === R.made.public).pop() || null;
    check(inPlace && granted && accepted && !!last && JSON.stringify(last.grant) === JSON.stringify(grantNow())
      && world.store(rt).get("team").lead.pub === R.made.public && licenceCalls.length >= 2,
      "rsk10b the team key's backup copy restored over the key made here is in place " + inPlace + ", nothing is sent for it until the lead signs"
      + " in again " + !!waited + ", the licence's grant then follows it " + !!granted + ", and the relay accepts the team's grant post under it " + !!accepted + ", the create carrying that grant "
      + (!!last && JSON.stringify(last.grant) === JSON.stringify(grantNow())) + " (restore " + JSON.stringify(back && (back.error || back.keyId))
      + ", licence calls " + JSON.stringify(licenceCalls) + ")");
  } catch (e) {
    check(false, "rsk10 threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally { shell.done(); }
};

/* Hold 2, the lead on a second computer. (a) The shared project.json keeps the folder the first computer wrote, and each
   computer's Desks screen names that computer's own mirror. */
LEGS.h2a = async () => {
  const world = await relayWorld(), lab = labDir("relay-h2a");
  const R = await leadAtRest(path.join(lab, "a"), "Lantern Quay");
  const verbs = ["teamFacts", "teamKeyBack", "openProject", "startRelayTeam", "undoRelayTeam", "listProjects"];
  const threadA = (verb, ...a) => (verbs.includes(verb) ? R.S[verb](...a) : {});
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("h2a-a"), env: R.env, thread: threadA });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { shellA.done(); }
  if (!recA) { check(false, "h2a profile A did not create the relay team"); return; }
  const folderBefore = R.projectJson().folder, mirrorA = recA.folder;
  const udB = path.join(lab, "b", "ud");
  fs.mkdirSync(udB, { recursive: true });
  const keyAtB = path.join(udB, "signing-key.json");
  fs.writeFileSync(keyAtB, JSON.stringify(R.made, null, 1) + "\n");
  granted(keyAtB, R.made.public);
  const teamsFileB = K.teamsFile(udB);
  const threadB = (verb, ...a) => (verbs.includes(verb) ? R.S[verb](...a) : {});
  const envB = { STUDIO_PROJECTS: path.dirname(R.proj), STUDIO_SIGNING_KEY: keyAtB, STUDIO_RELAY_ROOT: GRANT_ROOT_PUB };
  const shellB = await loadStudioShell(udB, { relay: world.transport("h2a-b"), env: envB, thread: threadB });
  let desksB = null;
  try { desksB = await shellB.ask("studio:desks", R.proj); await shellSettled(shellB); }
  finally { shellB.done(); }
  const recB = K.relayTeams(teamsFileB)[0] || null;
  const mirrorB = recB ? K.relayMirror(teamsFileB, recB.rt) : "";
  const projectAfter = R.projectJson();
  const readB = recB && mirrorB && fs.existsSync(mirrorB) ? await heldTeam(mirrorB, { key: keyAtB }) : { team: null };
  const shellA2 = await loadStudioShell(R.ud, { relay: world.transport("h2a-a2"), env: R.env, thread: threadA });
  let desksA = null;
  try { desksA = await shellA2.ask("studio:desks", R.proj); }
  finally { shellA2.done(); }
  const same = (a, b) => !!a && !!b && path.resolve(String(a)).toLowerCase() === path.resolve(String(b)).toLowerCase();
  const ok = {
    unchanged: projectAfter.folder === folderBefore && same(folderBefore, mirrorA) && !same(projectAfter.folder, mirrorB),
    own: !!recB && same(recB.folder, mirrorB) && !same(mirrorA, mirrorB),
    desksB: !!desksB && !desksB.error && same(desksB.folder, mirrorB),
    desksA: !!desksA && !desksA.error && same(desksA.folder, mirrorA),
    teamFile: !!readB.team && readB.team.id === recA.team,
  };
  check(Object.keys(ok).every((k) => ok[k] === true),
    "h2a two computers on one relay project: the shared project.json keeps the first computer's folder, and each Desks screen names that computer's mirror: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

/* (b) The second computer holds no licence. The Desks screen says this computer needs the licence, and not that there is
   nothing else to keep. A relay team whose grant holds says the key's backup brings the team's place on the relay back,
   and not the team's files. A team on a folder keeps the old sentence. */
LEGS.h2b = async () => {
  const { loadPage } = await import("./page-stand-in.mjs");
  const world = await relayWorld(), lab = labDir("relay-h2b");
  const R = await leadAtRest(path.join(lab, "a"), "Lantern Quay");
  const verbs = ["teamFacts", "teamKeyBack", "openProject", "startRelayTeam", "undoRelayTeam"];
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("h2b-a"), env: R.env, thread: (verb, ...a) => (verbs.includes(verb) ? R.S[verb](...a) : {}) });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { shellA.done(); }
  if (!recA) { check(false, "h2b profile A did not create the relay team"); return; }
  const udB = path.join(lab, "b", "ud");
  fs.mkdirSync(udB, { recursive: true });
  const keyAtB = path.join(udB, "signing-key.json");
  fs.writeFileSync(keyAtB, JSON.stringify(R.made, null, 1) + "\n");
  const envB = { STUDIO_PROJECTS: path.dirname(R.proj), STUDIO_SIGNING_KEY: keyAtB, STUDIO_RELAY_ROOT: GRANT_ROOT_PUB };
  const shellB = await loadStudioShell(udB, { relay: world.transport("h2b-b"), env: envB, thread: (verb, ...a) => (verbs.includes(verb) ? R.S[verb](...a) : {}) });
  let desksB = null;
  try { desksB = await shellB.ask("studio:desks", R.proj); await shellSettled(shellB); }
  finally { shellB.done(); }
  const NEW = "This Studio holds no licence yet, so it cannot work with the team. Once it is signed in with an account that holds the licence, from the Menu, under Settings, then Account, this computer works with the team as the first one does.";
  const OLD = "The team comes back with the signing key's backup copy. There is nothing else to keep.";
  const RELAY = "The key's backup copy brings back the signing key and the team's place on the relay, but not the team's files kept there.";
  const paint = (lang, desks) => {
    const home = loadPage({ api: {}, uiLang: lang }), P = home.page;
    Object.assign(P.S, { open: { dir: R.proj, draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [],
      project: { rev: 0, folder: desks.folder }, fileName: "lanterns.ec", counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
      host: { tour: { offered: true }, signing: { keyId: "studio-0123456789abcdef", print: "87ad0879ac3e9ff6", kept: "os", backup: null, problem: null } },
      screen: "projects", home: "team", teamDir: R.proj, cover: null, err: null, dkNote: null, q: "", desks });
    P.paintMain();
    const html = home.node("#main").innerHTML.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    return { html, T: P.T };
  };
  const shown = (desks) => {
    const en = paint("en", desks), pl = paint("pl", desks);
    return { enNew: en.html.indexOf(en.T(NEW)) >= 0, enOld: en.html.indexOf(en.T(OLD)) >= 0, enRelay: en.html.indexOf(en.T(RELAY)) >= 0,
      plNew: pl.html.indexOf(pl.T(NEW)) >= 0, plOld: pl.html.indexOf(pl.T(OLD)) >= 0, plRelay: pl.html.indexOf(pl.T(RELAY)) >= 0 };
  };
  const bare = desksB && !desksB.error ? shown(desksB) : null;
  const held = desksB ? shown(Object.assign({}, desksB, { relayLicence: "holds" })) : null;
  const folderTeam = shown({ folder: "C:\\share", file: "ours", requests: [], relayLicence: "none",
    team: { id: "t-0123456789abcdef", epoch: 1, relay: false, roster: [], sealed: true, exportsSealed: true, leadPrint: "87ad0879ac3e9ff6" } });
  const ok = {
    licence: !!desksB && desksB.error == null && desksB.relayLicence === "none",
    said: !!bare && bare.enNew && bare.plNew && !bare.enOld && !bare.plOld && !bare.enRelay && !bare.plRelay,
    holds: !!held && held.enRelay && held.plRelay && !held.enOld && !held.plOld && !held.enNew && !held.plNew,
    /* A team at a shared folder is held with one line and says none of the three (was: it kept the older sentence, "The team comes back with the signing key's backup copy..."). */
    folder: !folderTeam.enOld && !folderTeam.plOld && !folderTeam.enNew && !folderTeam.plNew && !folderTeam.enRelay && !folderTeam.plRelay,
  };
  check(Object.keys(ok).every((k) => ok[k] === true),
    "h2b a second computer with no licence is told on the Desks screen that it needs the licence, in place of there being nothing else to keep: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ")
    + (desksB && desksB.error ? "; error " + JSON.stringify(desksB.error) : "")
    + "; relayLicence " + JSON.stringify(desksB && desksB.relayLicence));
};

/* (d) Make a signing key, then restore the team key's backup. The made key has signed nothing and made no relay space, so it
   is set aside and the copy is restored. A key that has since been handed out to sign stays, and the copy is refused. */
LEGS.h2d = async () => {
  const Sign = await import("../src/sign.mjs");
  const St = await import("../src/studio.mjs");
  const lab = labDir("relay-h2d");
  const pair = await Sign.makePair(), copy = path.join(lab, "team-key-copy.json");
  fs.mkdirSync(lab, { recursive: true });
  fs.writeFileSync(copy, JSON.stringify(Sign.passphraseFile(pair, PASS), null, 1) + "\n");
  namePassphraseFile(copy);
  const thread = (verb, ...a) => (verb === "readBackup" || verb === "openBackup" ? Promise.resolve().then(() => St[verb](...a)) : Promise.resolve({}));
  const open = (name) => {
    const ud = path.join(lab, name), keyAt = path.join(ud, "signing-key.json");
    fs.mkdirSync(ud, { recursive: true });
    return loadStudioShell(ud, { env: { STUDIO_SIGNING_KEY: keyAt, STUDIO_TEST_RESTORE: copy }, thread });
  };
  const asideOf = (keyAt) => fs.readdirSync(path.dirname(keyAt)).filter((f) => /\.made-at-activation-/.test(f));
  const shell = await open("fresh");
  const keyAt = path.join(lab, "fresh", "signing-key.json");
  let made = null, back = null, asideKey = null;
  try {
    made = await shell.ask("studio:key-make");
    const pick = await shell.ask("studio:key-restore-pick", "t", "k");
    back = await shell.ask("studio:key-restore", pick && pick.file, PASS);
    const names = asideOf(keyAt);
    asideKey = names.length === 1 ? Sign.readKeyFile(path.join(path.dirname(keyAt), names[0])) : null;
  } finally { shell.done(); }
  const now = fs.existsSync(keyAt) ? Sign.readKeyFile(keyAt) : null;
  const restored = {
    back: !!back && !back.error && !!now && now.public === pair.public,
    aside: !!asideKey && !!made && asideKey.public === made.public && asideKey.kept === Sign.OS_WRAP,
    kept: asideOf(keyAt).length === 1,
  };
  const spent = await open("spent");
  const spentAt = path.join(lab, "spent", "signing-key.json");
  let spentMade = null, over = null;
  try {
    spentMade = await spent.ask("studio:key-make");
    await spent.ask("studio:team-exports", path.join(lab, "spent", "Etiuda Studio", "nowhere"), true);
    const pick = await spent.ask("studio:key-restore-pick", "t", "k");
    over = await spent.ask("studio:key-restore", pick && pick.file, PASS);
  } finally { spent.done(); }
  const spentNow = fs.existsSync(spentAt) ? Sign.readKeyFile(spentAt) : null;
  const stayed = {
    refused: !!over && over.error === "This Studio keeps another signing key, so the copy was not restored.",
    key: !!spentMade && !!spentNow && spentNow.public === spentMade.public,
    noAside: asideOf(spentAt).length === 0,
  };
  check(Object.keys(restored).every((k) => restored[k] === true) && Object.keys(stayed).every((k) => stayed[k] === true),
    "h2d a key made with Make a signing key, which has signed nothing and made no relay space, is set aside and the team key's backup is restored; a key handed out to sign stays: "
    + JSON.stringify({ restored, stayed, back: back && (back.error || back.keyId), over: over && over.error }));
};

/* Profile B, with its own user data, publishes a relay project. The edition is written into B's mirror and goes up the relay.
   A then publishes again, into A's own mirror. The shared project.json keeps the folder A wrote. */
LEGS.h2e = async () => {
  const world = await relayWorld(), lab = labDir("relay-h2e");
  const R = await leadAtRest(path.join(lab, "a"), "Lantern Quay");
  signedIn(R.ud);
  const verbs = ["teamFacts", "teamKeyBack", "openProject", "startRelayTeam", "undoRelayTeam", "publishProject"];
  const threadA = (verb, ...a) => (verbs.includes(verb) ? R.S[verb](...a) : {});
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("h2e-a"), env: R.env, thread: threadA });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
    await shellSettled(shellA);
  } finally { shellA.done(); }
  if (!recA) { check(false, "h2e profile A did not create the relay team"); return; }
  const rt = recA.rt, mirrorA = recA.folder;
  const seqOf = () => { const s = world.store(rt); return s ? (s.get("seq") || 0) : 0; };
  const beforeB = seqOf();
  const udB = path.join(lab, "b", "ud");
  fs.mkdirSync(udB, { recursive: true });
  const keyAtB = path.join(udB, "signing-key.json");
  fs.writeFileSync(keyAtB, JSON.stringify(R.made, null, 1) + "\n");
  granted(keyAtB, R.made.public);
  const teamsFileB = K.teamsFile(udB);
  const envB = { STUDIO_PROJECTS: path.dirname(R.proj), STUDIO_SIGNING_KEY: keyAtB, STUDIO_RELAY_ROOT: GRANT_ROOT_PUB };
  const threadB = (verb, ...a) => (verbs.includes(verb) ? R.S[verb](...a) : {});
  signedIn(udB);
  const shellB = await loadStudioShell(udB, { relay: world.transport("h2e-b"), env: envB, thread: threadB });
  let replyB = null;
  try {
    replyB = await shellB.ask("studio:publish", R.proj, { notes: "Edition from the second computer." });
    await shellSettled(shellB);
  } finally { shellB.done(); }
  const recB = K.relayTeams(teamsFileB)[0] || null;
  const mirrorB = recB ? K.relayMirror(teamsFileB, recB.rt) : "";
  const same = (a, b) => !!a && !!b && path.resolve(String(a)).toLowerCase() === path.resolve(String(b)).toLowerCase();
  const ecB = replyB && replyB.ec ? path.resolve(String(replyB.ec)) : "";
  const upB = seqOf() > beforeB;
  const shelfFile = fs.readdirSync(R.proj).find((n) => /\.draft\.json$/i.test(n));
  const shelf = shelfFile ? ((JSON.parse(fs.readFileSync(path.join(R.proj, shelfFile), "utf8")).tags || []).find((t) => t && t.kind === "shelf") || {}).id : "";
  if (shelf) await R.S.addCard(R.proj, shelf, "Second opening", "From the first computer.");
  const beforeA = seqOf();
  const shellA2 = await loadStudioShell(R.ud, { relay: world.transport("h2e-a2"), env: R.env, thread: threadA });
  let replyA = null;
  try {
    replyA = await shellA2.ask("studio:publish", R.proj, { notes: "Edition from the first computer." });
    await shellSettled(shellA2);
  } finally { shellA2.done(); }
  const ecA = replyA && replyA.ec ? path.resolve(String(replyA.ec)) : "";
  const projectAfter = R.projectJson();
  const ok = {
    landedB: !!replyB && replyB.error == null && replyB.refused == null && same(replyB.folder, mirrorB) && same(path.dirname(ecB), mirrorB) && fs.existsSync(ecB),
    upB,
    kept: same(projectAfter.folder, mirrorA) && !same(projectAfter.folder, mirrorB),
    landedA: !!replyA && replyA.error == null && replyA.refused == null && same(replyA.folder, mirrorA) && same(path.dirname(ecA), mirrorA) && fs.existsSync(ecA),
    upA: seqOf() > beforeA,
    apart: !same(mirrorA, mirrorB),
  };
  check(Object.keys(ok).every((k) => ok[k] === true),
    "h2e profile B publishes into its own mirror and the edition goes up the relay, and A still publishes into its own: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ")
    + (replyB && replyB.error ? "; B " + JSON.stringify(replyB.error) : "")
    + (replyA && replyA.error ? "; A " + JSON.stringify(replyA.error) : ""));
};

/* rpm1 AN OLDER MIRROR NEVER REPLACES A NEWER RELAY EDITION (Grok's review mu, 2026-11-22, the first B). Two computers on one lead
   key, each with its own copy of the project. A publishes rev 1; B, whose project still says rev 1, publishes rev 2 through the
   relay. A, which already keeps the team, presses Publish again with its mirror and project at rev 1: the press catches up with
   the relay before it numbers, so the edition goes out above B's (rev 3, the folder said to have held rev 2), and B's rev 2 is
   never replaced by a rev 2 of A's. Red on the base: A numbered from its own mirror, wrote rev 2, and its catch-up then sent
   that file up as superseding B's. */
LEGS.rpm1 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rpm1");
  const R = await leadAtRest(path.join(lab, "a"), "Lantern Quay");
  signedIn(R.ud);
  const verbs = ["teamFacts", "teamKeyBack", "openProject", "startRelayTeam", "undoRelayTeam", "publishProject"];
  const threadOf = (verb, ...a) => (verbs.includes(verb) ? R.S[verb](...a) : {});
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("rpm1-a"), env: R.env, thread: threadOf });
  let recA = null, replyA1 = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
    await shellSettled(shellA);
    replyA1 = await shellA.ask("studio:publish", R.proj, { notes: "Edition one, from the first computer." });
    await shellSettled(shellA);
  } finally { shellA.done(); }
  if (!recA || !replyA1 || replyA1.rev !== 1) { check(false, "rpm1 profile A did not make the relay team and publish rev 1: " + JSON.stringify(replyA1 && (replyA1.error || replyA1.rev))); return; }
  const shaOfFile = (at) => crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex");
  const ecA1 = shaOfFile(replyA1.ec);
  /* B: the same lead key, and its own copy of the project as A left it, at rev 1. */
  const projB = path.join(lab, "b", "projects", path.basename(R.proj));
  fs.cpSync(R.proj, projB, { recursive: true });
  const udB = path.join(lab, "b", "ud");
  fs.mkdirSync(udB, { recursive: true });
  const keyAtB = path.join(udB, "signing-key.json");
  fs.writeFileSync(keyAtB, JSON.stringify(R.made, null, 1) + "\n");
  granted(keyAtB, R.made.public);
  const envB = { STUDIO_PROJECTS: path.dirname(projB), STUDIO_SIGNING_KEY: keyAtB, STUDIO_RELAY_ROOT: GRANT_ROOT_PUB };
  signedIn(udB);
  const shellB = await loadStudioShell(udB, { relay: world.transport("rpm1-b"), env: envB, thread: threadOf });
  let replyB = null;
  try {
    replyB = await shellB.ask("studio:publish", projB, { notes: "Edition two, from the second computer." });
    await shellSettled(shellB);
  } finally { shellB.done(); }
  /* A again, which keeps the team, its mirror and project still at rev 1. Its sync at start does not reach the relay (a computer
     waking with no network yet), so the mirror is still behind when the network is back and the lead presses Publish. */
  const tA2 = world.transport("rpm1-a2");
  tA2.down = true;
  const shellA2 = await loadStudioShell(R.ud, { relay: tA2, env: R.env, thread: threadOf });
  let replyA2 = null, behind = false;
  try {
    await shellSettled(shellA2);
    behind = fs.existsSync(String(replyA1.ec)) && shaOfFile(replyA1.ec) === ecA1;
    tA2.down = false;
    replyA2 = await shellA2.ask("studio:publish", R.proj, { notes: "Edition three, from the first computer." });
    await shellSettled(shellA2);
  } finally { shellA2.done(); }
  const ok = {
    b: !!replyB && replyB.error == null && replyB.refused == null && replyB.rev === 2,
    behind,
    above: !!replyA2 && replyA2.error == null && replyA2.refused == null && replyA2.rev === 3,
    said: !!replyA2 && replyA2.folderNewer === 2,
  };
  check(Object.keys(ok).every((k) => ok[k] === true),
    "rpm1 a computer whose mirror is behind the relay catches up before it numbers, so its edition goes above the newer one the relay holds and never replaces it: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ")
    + "; B rev " + JSON.stringify(replyB && (replyB.error || replyB.rev)) + ", A rev " + JSON.stringify(replyA2 && (replyA2.error || replyA2.rev))
    + ", folderNewer " + JSON.stringify(replyA2 && replyA2.folderNewer));
};

/* (a) N1: a second computer, mirror not yet synced, first create refused, is not marked taken as another's and is not told
   to remake; after restore and Check now it comes back. */
LEGS.h2f = async () => {
  const world = await relayWorld(), lab = labDir("relay-h2f");
  const saidB = [];
  const sA = await studioLead(world, lab, { grantOpts: { paid: true } });
  await sA.runner.sync(); await sA.runner.idle();
  const deskKey = deskKeys();
  const dA = deskOf(world, lab, sA, "deskA", deskKey, new Map());
  put(dA.mirror, "desk-test.txt", "keep me\n");
  const udB = path.join(lab, "b-ud");
  fs.mkdirSync(udB, { recursive: true });
  const keyAtB = path.join(udB, "signing-key.json");
  const Sign = await import("../src/sign.mjs");
  const pairB = await Sign.makePair();
  fs.writeFileSync(keyAtB, JSON.stringify(Sign.passphraseFile(pairB, PASS), null, 1) + "\n");
  namePassphraseFile(keyAtB);
  granted(keyAtB, pairB.public);
  const teamsFileB = K.teamsFile(udB), vaultB = makeVault();
  K.keepTeamKey(teamsFileB, vaultB, sA.teamId, 1, sA.teamKey);
  const mirrorB = K.keepRelay(teamsFileB, sA.teamId, sA.rt, Relay.RELAY_URL);
  fs.mkdirSync(mirrorB, { recursive: true });
  put(udB, "studio-test.txt", "studio stays\n");
  const deskFileBefore = read(dA.mirror, "desk-test.txt");
  const studioFileBefore = read(udB, "studio-test.txt");
  const tB = world.transport("b");
  const runnerB = trackRunner({ roots: GRANT_ROOTS, teamsFile: teamsFileB, vault: vaultB, keyFile: keyAtB, secret: () => labSecret(keyAtB),
    request: tB.request, connect: tB.connect, watch: false, pollMs: 1e9, clock: () => Date.now(),
    say: (l) => saidB.push(l) });
  try {
    await runnerB.sync(); await runnerB.idle();
    const rowB = K.relayTeams(teamsFileB).find((w) => w.team === sA.teamId) || {};
    const deskFileAfter = read(dA.mirror, "desk-test.txt");
    const studioFileAfter = read(udB, "studio-test.txt");
    const unreadSaid = saidB.some((l) => l === "relay of team " + sA.teamId + ": " + Relay.FIRST_UNREAD_SAID);
    const takenFirstSaid = saidB.some((l) => l.indexOf(Relay.TAKEN_SAID_FIRST) >= 0);
    const takenSaid = saidB.some((l) => l.indexOf(Relay.TAKEN_SAID) >= 0);
    const notTaken = rowB.taken !== true;
    const filesKept = deskFileAfter === deskFileBefore && studioFileAfter === studioFileBefore;
    fs.writeFileSync(keyAtB, JSON.stringify(sA.lead, null, 1) + "\n");
    granted(keyAtB, sA.lead.public);
    await runnerB.sync({ askTaken: true }); await runnerB.idle();
    const rowAfter = K.relayTeams(teamsFileB).find((w) => w.team === sA.teamId) || {};
    const teamAfter = await heldTeam(mirrorB, { key: keyAtB });
    const comesBack = rowAfter.created === true && !!teamAfter.team && teamAfter.team.id === sA.teamId;
    const ok = { unreadSaid, notTaken, notRemake: !takenFirstSaid && !takenSaid, filesKept, comesBack };
    check(Object.values(ok).every((v) => v === true), "h2f N1 second computer unread create refused, not marked taken, files unchanged, restore brings it back: "
      + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + (saidB.length ? " (" + saidB.slice(-2).join(" | ") + ")" : ""));
  } finally {
    await sA.runner.stop();
    await runnerB.stop();
  }
};

/* (b) A desk withdraws while only the first computer fetched its request; on the second computer the refused enrolment
   is put right by the evidence rule, and no other desk is taken off. */
LEGS.h2g = async () => {
  const world = await relayWorld(), lab = labDir("relay-h2g");
  const sA = await studioLead(world, lab, { grantOpts: { paid: true } });
  const S = await import("../src/studio.mjs");
  const udB = path.join(lab, "b-ud");
  fs.mkdirSync(udB, { recursive: true });
  const keyAtB = path.join(udB, "signing-key.json");
  fs.writeFileSync(keyAtB, JSON.stringify(sA.lead, null, 1) + "\n");
  granted(keyAtB, sA.lead.public);
  const teamsFileB = K.teamsFile(udB), vaultB = makeVault();
  K.keepTeamKey(teamsFileB, vaultB, sA.teamId, 1, sA.teamKey);
  const mirrorB = K.keepRelay(teamsFileB, sA.teamId, sA.rt, Relay.RELAY_URL);
  fs.mkdirSync(mirrorB, { recursive: true });
  const secretN = newSecret(), riN = Relay.relayInvite(secretN);
  const madeN = makeInvite({ team: sA.teamId, folder: sA.mirror, lead: { keyId: sA.lead.keyId, public: sA.lead.public } },
    "Nera Quay", secretN, Date.now(), undefined, { rt: sA.rt, url: Relay.RELAY_URL, token: riN.token, inv: riN.inv });
  K.keepInvite(sA.teamsFile, sA.vault, sA.teamId, { id: madeN.id, secret: secretN, made: madeN.made, expires: madeN.expires, name: madeN.name, relay: riN });
  K.keepInvite(teamsFileB, vaultB, sA.teamId, { id: madeN.id, secret: secretN, made: madeN.made, expires: madeN.expires, name: madeN.name, relay: riN });
  const secretM = newSecret(), riM = Relay.relayInvite(secretM);
  const madeM = makeInvite({ team: sA.teamId, folder: sA.mirror, lead: { keyId: sA.lead.keyId, public: sA.lead.public } },
    "Mira Lantern", secretM, Date.now(), undefined, { rt: sA.rt, url: Relay.RELAY_URL, token: riM.token, inv: riM.inv });
  K.keepInvite(sA.teamsFile, sA.vault, sA.teamId, { id: madeM.id, secret: secretM, made: madeM.made, expires: madeM.expires, name: madeM.name, relay: riM });
  K.keepInvite(teamsFileB, vaultB, sA.teamId, { id: madeM.id, secret: secretM, made: madeM.made, expires: madeM.expires, name: madeM.name, relay: riM });
  await sA.runner.sync(); await sA.runner.idle();
  const whoN = deskKeys(), heldN = new Map();
  const dN = deskOf(world, lab, sA, "deskN", whoN, heldN, { invite: () => ({ inv: riN.inv, token: riN.token, seal: riN.seal }) });
  const whoM = deskKeys(), heldM = new Map();
  const dM = deskOf(world, lab, sA, "deskM", whoM, heldM, { invite: () => ({ inv: riM.inv, token: riM.token, seal: riM.seal }) });
  const relN = "desks/" + whoN.keyId + "/join.json";
  const relM = "desks/" + whoM.keyId + "/join.json";
  const tB = world.transport("b");
  const saidB = [];
  const runnerB = trackRunner({ roots: GRANT_ROOTS, teamsFile: teamsFileB, vault: vaultB, keyFile: keyAtB, secret: () => labSecret(keyAtB),
    request: tB.request, connect: tB.connect, watch: false, pollMs: 1e9, clock: () => Date.now(),
    say: (l) => saidB.push(l) });
  try {
    await runnerB.sync(); await runnerB.idle();
    put(dN.mirror, relN, JSON.stringify(joinRequest(sA.teamId, whoN, { id: madeN.id, secret: secretN }), null, 1) + "\n");
    dN.ch.start(); await settle(dN.ch);
    put(dM.mirror, relM, JSON.stringify(joinRequest(sA.teamId, whoM, { id: madeM.id, secret: secretM }), null, 1) + "\n");
    dM.ch.start(); await settle(dM.ch);
    const reqRow = world.entries(sA.rt).filter(([k, v]) => k.startsWith("blob:") && v && v.writer === whoN.keyId && v.pub && v.del !== true).map(([, v]) => v)[0];
    tB.answer = async (method, url) => {
      if (method === "GET" && reqRow && String(url).endsWith("/b/" + reqRow.id))
        return { status: 404, bytes: Buffer.from("{}"), header: () => null };
      return null;
    };
    sA.chan().kick(); await sA.chan().idle();
    const fetchedByA = !!read(sA.mirror, relN) && !!read(sA.mirror, relM);
    const fetchedByB = !!read(mirrorB, relN);
    await S.watchAdmit(sA.mirror, sA.keyAt, labSecret(sA.keyAt), { auto: false, teamKeys: K.teamKeysOf(sA.teamsFile, sA.vault),
      invites: K.inviteBookOf(sA.teamsFile, sA.vault), teamsFile: sA.teamsFile });
    fs.copyFileSync(path.join(sA.mirror, world.C.TEAM_NAME), path.join(mirrorB, world.C.TEAM_NAME));
    fs.unlinkSync(path.join(dN.mirror, ...relN.split("/")));
    await settle(dN.ch);
    const withdrawnAtRelay = (world.store(sA.rt).get("inv:" + riN.inv) || {}).withdrawn === true;
    await runnerB.sync(); await runnerB.idle();
    const hB = await heldTeam(mirrorB, { key: keyAtB });
    const rosterB = hB.team ? (hB.team.roster || []).map((e) => e && e.desk && e.desk.id) : [];
    const enrolledM = !!world.store(sA.rt).get("dev:" + whoM.keyId);
    const enrolledN = !!world.store(sA.rt).get("dev:" + whoN.keyId);
    const ok = {
      onlyAFetched: fetchedByA && !fetchedByB,
      withdrawnAtRelay,
      withdrawnOff: rosterB.indexOf(whoN.keyId) < 0,
      otherEnrolled: rosterB.indexOf(whoM.keyId) >= 0 && enrolledM && !enrolledN,
    };
    check(Object.values(ok).every((v) => v === true), "h2g withdrawal on second computer put right by evidence rule: "
      + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + (saidB.length ? " (" + saidB.slice(-2).join(" | ") + ")" : ""));
  } finally {
    await sA.runner.stop();
    await runnerB.stop();
    await dN.ch.stop();
    await dM.ch.stop();
  }
};

/* (c) The reopened row on the second computer. */
LEGS.h2h = async () => {
  const world = await relayWorld(), lab = labDir("relay-h2h");
  const sA = await studioLead(world, lab, { grantOpts: { paid: true } });
  const S = await import("../src/studio.mjs");
  const udB = path.join(lab, "b-ud");
  fs.mkdirSync(udB, { recursive: true });
  const keyAtB = path.join(udB, "signing-key.json");
  fs.writeFileSync(keyAtB, JSON.stringify(sA.lead, null, 1) + "\n");
  granted(keyAtB, sA.lead.public);
  const teamsFileB = K.teamsFile(udB), vaultB = makeVault();
  K.keepTeamKey(teamsFileB, vaultB, sA.teamId, 1, sA.teamKey);
  const mirrorB = K.keepRelay(teamsFileB, sA.teamId, sA.rt, Relay.RELAY_URL);
  fs.mkdirSync(mirrorB, { recursive: true });
  const secretN = newSecret(), riN = Relay.relayInvite(secretN);
  const madeN = makeInvite({ team: sA.teamId, folder: sA.mirror, lead: { keyId: sA.lead.keyId, public: sA.lead.public } },
    "Nera Quay", secretN, Date.now(), undefined, { rt: sA.rt, url: Relay.RELAY_URL, token: riN.token, inv: riN.inv });
  K.keepInvite(sA.teamsFile, sA.vault, sA.teamId, { id: madeN.id, secret: secretN, made: madeN.made, expires: madeN.expires, name: madeN.name, relay: riN });
  K.keepInvite(teamsFileB, vaultB, sA.teamId, { id: madeN.id, secret: secretN, made: madeN.made, expires: madeN.expires, name: madeN.name, relay: riN });
  await sA.runner.sync(); await sA.runner.idle();
  const whoN = deskKeys(), heldN = new Map();
  const dN = deskOf(world, lab, sA, "deskN", whoN, heldN, { invite: () => ({ inv: riN.inv, token: riN.token, seal: riN.seal }) });
  const relN = "desks/" + whoN.keyId + "/join.json";
  const tB = world.transport("b");
  const saidB = [];
  const runnerB = trackRunner({ roots: GRANT_ROOTS, teamsFile: teamsFileB, vault: vaultB, keyFile: keyAtB, secret: () => labSecret(keyAtB),
    request: tB.request, connect: tB.connect, watch: false, pollMs: 1e9, clock: () => Date.now(),
    say: (l) => saidB.push(l) });
  try {
    await runnerB.sync(); await runnerB.idle();
    put(dN.mirror, relN, JSON.stringify(joinRequest(sA.teamId, whoN, { id: madeN.id, secret: secretN }), null, 1) + "\n");
    dN.ch.start(); await settle(dN.ch);
    sA.chan().kick(); await sA.chan().idle();
    await S.watchAdmit(sA.mirror, sA.keyAt, labSecret(sA.keyAt), { auto: false, teamKeys: K.teamKeysOf(sA.teamsFile, sA.vault),
      invites: K.inviteBookOf(sA.teamsFile, sA.vault), teamsFile: sA.teamsFile });
    fs.copyFileSync(path.join(sA.mirror, world.C.TEAM_NAME), path.join(mirrorB, world.C.TEAM_NAME));
    fs.unlinkSync(path.join(dN.mirror, ...relN.split("/")));
    await settle(dN.ch);
    await runnerB.sync(); await runnerB.idle();
    const invB = (K.invitesOf(teamsFileB, sA.teamId) || []).find((r) => r.id === madeN.id) || {};
    const reopenedFlag = invB.reopened === true;
    const { loadPage } = await import("./page-stand-in.mjs");
    const open = { dir: mirrorB, draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [],
      project: { rev: 0, folder: mirrorB }, fileName: "lanterns.ec", counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } };
    const payload = {
      error: null, folder: mirrorB, file: "ours", inside: false, requests: [], autoAdmit: false, keyOpens: true, signing: "studio-harbour",
      invites: [Object.assign({}, invB, { id: madeN.id, person: "Nera Quay", relay: true, reopened: reopenedFlag, used: Date.now() })],
      team: { id: sA.teamId, epoch: 1, relay: true, sealed: true, lists: true, exportsSealed: true, roster: [], recovery: false, leadPrint: "87ad0879ac3e9ff6" },
    };
    const api = { desks: async () => JSON.parse(JSON.stringify(payload)) };
    const paint = async (lang) => {
      const home = loadPage({ api, uiLang: lang }), P = home.page;
      Object.assign(P.S, { open, screen: "projects", home: "team", teamDir: open.dir });
      await P.desksLoad();
      return home.node("#main").innerHTML.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    };
    const EN = "The teammate that used it took its request back. No other teammate can use this invitation, and that one may not be able to either; a new one is the sure way in.";
    const PLs = "Członek zespołu, który z niego skorzystał, wycofał prośbę. Nikt inny nie może skorzystać z tego zaproszenia, a on być może również nie; pewną drogą jest nowe zaproszenie.";
    const enHtml = await paint("en"), plHtml = await paint("pl");
    const ok = {
      reopenedFlag,
      enSaid: enHtml.indexOf(EN) >= 0,
      plSaid: plHtml.indexOf(PLs) >= 0,
    };
    check(Object.values(ok).every((v) => v === true), "h2h reopened row on second computer shows copywriter sentence: "
      + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + (saidB.length ? " (" + saidB.slice(-2).join(" | ") + ")" : ""));
  } finally {
    await sA.runner.stop();
    await runnerB.stop();
    await dN.ch.stop();
  }
};

/* h2i: (second-computer C1) the evidence rule takes the later of the store's and the roster's asked records for a desk. */
LEGS.h2i = async () => {
  const world = await relayWorld(), lab = labDir("relay-h2i");
  const sA = await studioLead(world, lab, { grantOpts: { paid: true } });
  const S = await import("../src/studio.mjs");
  const udB = path.join(lab, "b-ud");
  fs.mkdirSync(udB, { recursive: true });
  const keyAtB = path.join(udB, "signing-key.json");
  fs.writeFileSync(keyAtB, JSON.stringify(sA.lead, null, 1) + "\n");
  granted(keyAtB, sA.lead.public);
  const teamsFileB = K.teamsFile(udB), vaultB = makeVault();
  K.keepTeamKey(teamsFileB, vaultB, sA.teamId, 1, sA.teamKey);
  const mirrorB = K.keepRelay(teamsFileB, sA.teamId, sA.rt, Relay.RELAY_URL);
  fs.mkdirSync(mirrorB, { recursive: true });
  const secretN = newSecret(), riN = Relay.relayInvite(secretN);
  const madeN = makeInvite({ team: sA.teamId, folder: sA.mirror, lead: { keyId: sA.lead.keyId, public: sA.lead.public } },
    "Nera Quay", secretN, Date.now(), undefined, { rt: sA.rt, url: Relay.RELAY_URL, token: riN.token, inv: riN.inv });
  K.keepInvite(sA.teamsFile, sA.vault, sA.teamId, { id: madeN.id, secret: secretN, made: madeN.made, expires: madeN.expires, name: madeN.name, relay: riN });
  K.keepInvite(teamsFileB, vaultB, sA.teamId, { id: madeN.id, secret: secretN, made: madeN.made, expires: madeN.expires, name: madeN.name, relay: riN });
  await sA.runner.sync(); await sA.runner.idle();
  const whoN = deskKeys(), heldN = new Map();
  const dN = deskOf(world, lab, sA, "deskN", whoN, heldN, { invite: () => ({ inv: riN.inv, token: riN.token, seal: riN.seal }) });
  const relN = "desks/" + whoN.keyId + "/join.json";
  const tB = world.transport("b");
  const runnerB = trackRunner({ roots: GRANT_ROOTS, teamsFile: teamsFileB, vault: vaultB, keyFile: keyAtB, secret: () => labSecret(keyAtB),
    request: tB.request, connect: tB.connect, watch: false, pollMs: 1e9, clock: () => Date.now() });
  try {
    put(dN.mirror, relN, JSON.stringify(joinRequest(sA.teamId, whoN, { id: madeN.id, secret: secretN }), null, 1) + "\n");
    dN.ch.start(); await settle(dN.ch);
    const r1Row = world.entries(sA.rt).filter(([k, v]) => k.startsWith("blob:") && v && v.writer === whoN.keyId && v.pub && v.del !== true).map(([, v]) => v)[0];
    K.markAsked(teamsFileB, sA.teamId, whoN.keyId, { id: r1Row.id, epoch: 1, counter: 1 });
    fs.unlinkSync(path.join(dN.mirror, ...relN.split("/")));
    await settle(dN.ch);
    put(dN.mirror, relN, JSON.stringify(joinRequest(sA.teamId, whoN, { id: madeN.id, secret: secretN }), null, 1) + "\n");
    await settle(dN.ch);
    sA.chan().kick(); await sA.chan().idle();
    await S.watchAdmit(sA.mirror, sA.keyAt, labSecret(sA.keyAt), { auto: false, teamKeys: K.teamKeysOf(sA.teamsFile, sA.vault),
      invites: K.inviteBookOf(sA.teamsFile, sA.vault), teamsFile: sA.teamsFile });
    fs.copyFileSync(path.join(sA.mirror, world.C.TEAM_NAME), path.join(mirrorB, world.C.TEAM_NAME));
    fs.unlinkSync(path.join(dN.mirror, ...relN.split("/")));
    await settle(dN.ch);
    await runnerB.sync(); await runnerB.idle();
    const hB = await heldTeam(mirrorB, { key: keyAtB });
    const rosterB = hB.team ? (hB.team.roster || []).map((e) => e && e.desk && e.desk.id) : [];
    const ok = {
      storeHadOld: K.askedOf(teamsFileB, sA.teamId, whoN.keyId) !== null,
      withdrawnOff: rosterB.indexOf(whoN.keyId) < 0,
    };
    check(Object.values(ok).every((v) => v === true), "h2i evidence rule takes later of store and roster asked records: "
      + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
  } finally {
    await sA.runner.stop();
    await runnerB.stop();
    await dN.ch.stop();
  }
};

/* h2j: (second-computer C2) a restored key meeting a place truly held by another key does not loop FIRST_UNREAD_SAID. */
LEGS.h2j = async () => {
  const world = await relayWorld(), lab = labDir("relay-h2j");
  const sA = await studioLead(world, lab, { grantOpts: { paid: true } });
  await sA.runner.sync(); await sA.runner.idle();
  const udB = path.join(lab, "b-ud");
  fs.mkdirSync(udB, { recursive: true });
  const keyAtB = path.join(udB, "signing-key.json");
  fs.writeFileSync(keyAtB, JSON.stringify(sA.lead, null, 1) + "\n");
  granted(keyAtB, sA.lead.public);
  const teamsFileB = K.teamsFile(udB), vaultB = makeVault();
  K.keepTeamKey(teamsFileB, vaultB, sA.teamId, 1, sA.teamKey);
  const mirrorB = K.keepRelay(teamsFileB, sA.teamId, sA.rt, Relay.RELAY_URL);
  fs.mkdirSync(mirrorB, { recursive: true });
  K.markRelay(teamsFileB, sA.teamId, { lead: sA.lead.public });
  const saidB = [];
  const tB = world.transport("b");
  tB.answer = (method, url) => {
    if (method === "POST" && String(url).endsWith("/teams")) {
      return { status: 403, bytes: Buffer.from(JSON.stringify({ error: "not-enrolled" })), header: () => null };
    }
    return null;
  };
  const runnerB = trackRunner({ roots: GRANT_ROOTS, teamsFile: teamsFileB, vault: vaultB, keyFile: keyAtB, secret: () => labSecret(keyAtB),
    request: tB.request, connect: tB.connect, watch: false, pollMs: 1e9, clock: () => Date.now(),
    say: (l) => saidB.push(l) });
  try {
    await runnerB.sync(); await runnerB.idle();
    const rowB = K.relayTeams(teamsFileB).find((w) => w.team === sA.teamId) || {};
    const ok = {
      takenMarked: rowB.taken === true && rowB.takenFirst === true,
      saidTakenFirst: saidB.some((l) => l.indexOf(Relay.TAKEN_SAID_FIRST) >= 0),
      notUnreadSaid: saidB.every((l) => l.indexOf(Relay.FIRST_UNREAD_SAID) < 0),
    };
    check(Object.values(ok).every((v) => v === true), "h2j restored key meeting taken place says TAKEN_SAID_FIRST not FIRST_UNREAD_SAID: "
      + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + "; said " + JSON.stringify(saidB));
  } finally {
    await sA.runner.stop();
    await runnerB.stop();
  }
};

/* ---- E4 OF RELAY-LIFE-H345, STUDIO'S SIDE: a desk takes its request back at the relay after the relay accepted it ------------
 * Claude alpha's ruling (c), as the test architect recorded it: "Cancel after acceptance withdraws the request at the relay, so the
 * lead no longer sees it and a later yes does not join the desk. The key stays on the desk, so Ask again works without a new link."
 * Each scene is a Studio leading one team on the lab's relay with one relay invitation per desk, each desk the pinned channel as a
 * desk runs it; the watch is run as the shell runs it: admitted, the invitation marked spent with its desk, and "joined" written. */
async function e4Scene(name, names) {
  const world = await relayWorld(), lab = labDir("relay-" + name), lines = [];
  const s = await studioLead(world, lab, { say: (l) => lines.push(l) });
  const S = await import("../src/studio.mjs"), Join = await import("../src/join.mjs");
  const target = { team: s.teamId, folder: s.mirror, lead: { keyId: s.lead.keyId, public: s.lead.public } };
  const desks = names.map((n, k) => {
    const secret = newSecret(), ri = Relay.relayInvite(secret);
    const made = makeInvite(target, n, secret, Date.now(), undefined, { rt: s.rt, url: Relay.RELAY_URL, token: ri.token, inv: ri.inv });
    K.keepInvite(s.teamsFile, s.vault, s.teamId, { id: made.id, secret, made: made.made, expires: made.expires, name: made.name, relay: ri });
    const who = deskKeys(), held = new Map();
    const d = deskOf(world, lab, s, "desk" + k, who, held, { invite: () => ({ inv: ri.inv, token: ri.token, seal: ri.seal }) });
    return { id: who.keyId, who, d, secret, ri, made, rel: "desks/" + who.keyId + "/join.json" };
  });
  await s.runner.sync(); await s.runner.idle();
  const E = { world, lab, lines, s, desks };
  /* The desk writes its request (Ask, or Ask again, which asks anew on the same invitation) and its channel sends it. */
  E.ask = async (x) => {
    put(x.d.mirror, x.rel, JSON.stringify(joinRequest(s.teamId, x.who, { id: x.made.id, secret: x.secret }), null, 1) + "\n");
    if (!x.started) { x.started = true; x.d.ch.start(); }
    await settle(x.d.ch);
  };
  /* The desk's Cancel after the relay accepted: its request leaves its own mirror, and its channel sends the deletion. */
  E.withdraw = async (x) => { fs.unlinkSync(path.join(x.d.mirror, ...x.rel.split("/"))); await settle(x.d.ch); };
  E.invRec = (x) => world.store(s.rt).get("inv:" + x.ri.inv) || {};
  E.lead = async () => { s.chan().kick(); await s.chan().idle(); };
  E.sync = async () => { const r = await s.runner.sync(); await s.runner.idle(); return r; };
  /* The watch in its two halves, as the shell runs them: the thread admits and writes the team, then the shell marks each
     invitation spent and writes "joined". A leg may put something between the two. */
  E.admit = () => S.watchAdmit(s.mirror, s.keyAt, labSecret(s.keyAt), { auto: false, teamKeys: K.teamKeysOf(s.teamsFile, s.vault),
    invites: K.inviteBookOf(s.teamsFile, s.vault), teamsFile: s.teamsFile });
  E.mark = async (r) => {
    for (const p of r.spent || []) K.endInvite(s.teamsFile, s.teamId, p.invite, "spent", p.desk);
    const refused = await Relay.answerAdmitted(s.runner, { teamsFile: s.teamsFile, vault: s.vault, team: s.teamId, folder: s.mirror,
      spent: r.spent || [] });
    return { admitted: r.admitted || [], spent: r.spent || [], refused };
  };
  E.watch = async () => E.mark(await E.admit());
  /* The Desks pane's two halves: the members on the signed roster, and the requests still asking. */
  E.pane = async () => {
    const h = await heldTeam(s.mirror, { key: s.keyAt });
    const roster = h.team ? (h.team.roster || []).filter((e) => e && e.desk).map((e) => e.desk.id) : [];
    const asking = h.team ? Join.listJoins(s.mirror, h.team, { invites: K.inviteBookOf(s.teamsFile, s.vault) }).map((r) => r.id) : [];
    return { roster, asking };
  };
  E.row = (x) => K.relayInvitesOf(s.teamsFile, s.vault, s.teamId).find((i) => i.id === x.made.id) || {};
  E.devicesPosts = () => s.t.log.filter((l) => l === "POST devices").length;
  E.stop = async () => {
    for (const x of desks) { x.d.t.down = true; await x.d.ch.stop(); }
    await s.runner.stop();
  };
  return E;
}
const tail = (E) => (E.lines.length ? " (" + E.lines.slice(-3).join(" | ") + ")" : "");

/* rse4a: the yes given, then the desk's withdrawal: the lead's channel opens it under the spent invitation's key, so the request
   leaves the mirror, and after the next sync the Desks pane names that desk neither as a member nor as asking. */
LEGS.rse4a = async () => {
  const E = await e4Scene("rse4a", ["Nera Quay"]);
  try {
    const [N] = E.desks;
    await E.ask(N); await E.sync();
    const landed = !!read(E.s.mirror, N.rel);
    const yes = await E.watch();
    await E.withdraw(N);
    const atRelay = E.invRec(N).withdrawn === true;
    await E.lead();
    const kept = !!read(E.s.mirror, N.rel);
    await E.sync();
    const pane = await E.pane();
    check(landed && yes.admitted.indexOf(N.id) >= 0 && atRelay && !kept && pane.roster.indexOf(N.id) < 0 && pane.asking.indexOf(N.id) < 0,
      "rse4a a desk's withdrawal after the yes takes its request out of the lead's mirror and Desks pane: landed " + landed + ", admitted "
      + (yes.admitted.indexOf(N.id) >= 0) + ", withdrawn at the relay " + atRelay + ", request still in the mirror " + kept
      + ", on the roster " + (pane.roster.indexOf(N.id) >= 0) + ", asking " + (pane.asking.indexOf(N.id) >= 0) + tail(E));
  } finally { await E.stop(); }
};

/* rse4b: a yes racing the withdrawal. The relay refuses the set that would enrol the withdrawn key (withdrawn); Studio takes that
   desk off the signed roster and enrols the rest in the same sync, so another desk let in beside it is enrolled, and the next sync
   owes the relay nothing. */
LEGS.rse4b = async () => {
  const E = await e4Scene("rse4b", ["Nera Quay", "Mira Lantern"]);
  try {
    const [N, M] = E.desks;
    await E.ask(N); await E.ask(M); await E.sync();
    const yes = await E.watch();
    await E.withdraw(N);
    const before = E.devicesPosts();
    const r = await E.sync();
    const posts = E.devicesPosts() - before;
    const store = E.world.store(E.s.rt);
    const enrolledM = !!store.get("dev:" + M.id), enrolledN = !!store.get("dev:" + N.id);
    const pane = await E.pane();
    const synced = (r || []).every((x) => x.ok === true);
    const again = E.devicesPosts(); await E.sync();
    const quiet = E.devicesPosts() === again;
    check(yes.admitted.length === 2 && E.invRec(N).withdrawn === true && posts >= 2 && enrolledM && !enrolledN && synced && quiet
      && pane.roster.indexOf(N.id) < 0 && pane.roster.indexOf(M.id) >= 0,
      "rse4b a yes racing the withdrawal leaves the withdrawn desk off the signed roster and enrols the other in the same sync: admitted "
      + yes.admitted.length + ", devices posts " + posts + ", other enrolled " + enrolledM + ", withdrawn enrolled " + enrolledN
      + ", sync ok " + synced + ", nothing owed after " + quiet + ", withdrawn on the roster " + (pane.roster.indexOf(N.id) >= 0)
      + ", other on the roster " + (pane.roster.indexOf(M.id) >= 0) + tail(E));
  } finally { await E.stop(); }
};

/* rse4c: Ask again after the withdrawal, on the same invitation, with no new link: the lead's channel opens the new request, the
   watch lets it in as a first ask, "joined" is written, and the same sync enrols the desk. */
LEGS.rse4c = async () => {
  const E = await e4Scene("rse4c", ["Nera Quay"]);
  try {
    const [N] = E.desks;
    await E.ask(N); await E.sync();
    await E.watch();
    await E.withdraw(N);
    await E.lead(); await E.sync();
    await E.ask(N);
    const asked = E.invRec(N).withdrawn !== true && E.invRec(N).uploaded === true;
    await E.sync();
    const seen = !!read(E.s.mirror, N.rel);
    const paneSeen = await E.pane();
    const yes = await E.watch();
    const same = yes.spent.some((p) => p.invite === N.made.id && p.desk === N.id);
    await E.sync();
    const enrolled = !!E.world.store(E.s.rt).get("dev:" + N.id);
    const pane = await E.pane();
    check(asked && seen && paneSeen.asking.indexOf(N.id) >= 0 && same && yes.refused.length === 0 && enrolled && pane.roster.indexOf(N.id) >= 0,
      "rse4c Ask again after the withdrawal is seen and joins on the lead's yes by the same invitation: asked at the relay " + asked
      + ", in the mirror " + seen + ", asking in the pane " + (paneSeen.asking.indexOf(N.id) >= 0) + ", let in by the same invitation "
      + same + ", joined written " + (yes.refused.length === 0) + ", enrolled " + enrolled + ", on the roster " + (pane.roster.indexOf(N.id) >= 0)
      + tail(E));
  } finally { await E.stop(); }
};

/* rse4d: a spent invitation's key opens its own desk's withdrawal and nothing of another desk's: a request another key sealed under
   that same seal, listed beside the withdrawal, does not reach the mirror. */
LEGS.rse4d = async () => {
  const E = await e4Scene("rse4d", ["Nera Quay"]);
  try {
    const [N] = E.desks, s = E.s, world = E.world;
    await E.ask(N); await E.sync();
    await E.watch();
    await E.withdraw(N);
    const who = deskKeys();
    const b = world.B.seal({ relayTeamId: s.rt, epoch: 1, teamKey: N.ri.seal, writer: { keyId: who.keyId, privateKey: who.privateKey },
      path: "desks/" + who.keyId + "/join.json", body: JSON.stringify(joinRequest(s.teamId, who, { id: N.made.id, secret: N.secret })) + "\n",
      counter: Date.now(), place: "desk:" + who.keyId, kind: "file" });
    world.inject(s.rt, { v: 1, id: b.id, supersedes: null, epoch: b.epoch, writer: b.writerKeyId, counter: b.counter, del: false,
      sig: b.signature, nonce: b.nonce, place: b.place, pub: who.pub }, b.ciphertext);
    await E.lead();
    const own = !read(s.mirror, N.rel), other = !!read(s.mirror, "desks/" + who.keyId + "/join.json");
    check(own && !other, "rse4d a spent invitation's key opens its own desk's withdrawal and not another desk's request under the same seal: "
      + "own withdrawal opened " + own + ", other request landed " + other + tail(E));
  } finally { await E.stop(); }
};

/* rse4e: H1 of the test architect's read of 0884c23. A desk let in and enrolled whose invitation is past the relay's keep (the pin's
   prune leaves it {spent: true}, read "used", as a withdrawn one is) and whose wrap it has not read stays on the signed roster and
   enrolled when another desk's withdrawal is refused; only the desk whose withdrawal this Studio fetched is taken off. */
LEGS.rse4e = async () => {
  const E = await e4Scene("rse4e", ["Lina Quay", "Nera Quay"]);
  try {
    const [L, N] = E.desks, store = E.world.store(E.s.rt);
    await E.ask(L); await E.sync();
    await E.watch(); await E.sync();
    const first = !!store.get("dev:" + L.id);
    store.put("inv:" + L.ri.inv, { spent: true });
    await E.ask(N); await E.sync();
    await E.watch();
    await E.withdraw(N);
    await E.sync();
    const pane = await E.pane(), rowL = E.row(L);
    const keptL = !!store.get("dev:" + L.id) && pane.roster.indexOf(L.id) >= 0 && rowL.state === "spent" && !rowL.gone;
    const offN = !store.get("dev:" + N.id) && pane.roster.indexOf(N.id) < 0;
    check(first && keptL && offN, "rse4e an enrolled desk whose invitation is past the relay's keep, its wrap unread, stays on the roster and"
      + " enrolled when another desk's withdrawal is refused: enrolled first " + first + ", still enrolled " + !!store.get("dev:" + L.id)
      + ", on the roster " + (pane.roster.indexOf(L.id) >= 0) + ", its invitation " + (rowL.state || "none") + (rowL.gone ? " gone" : "")
      + ", the withdrawn desk off " + offN + tail(E));
  } finally { await E.stop(); }
};

/* rse4f: the test architect's C2, the copywriter's words of 2026-10-27 10:34. An invitation the withdrawal made live again reaches
   the page from the shell's own Desks reply marked reopened, and its row says her sentence in place of the relay's first use, in
   English and in Polish; an ordinary used row keeps the relay's first use. Once the invitation is used again the mark is gone. */
LEGS.rse4f = async () => {
  const world = await relayWorld(), lab = labDir("relay-rse4f");
  const S = await shellLead(world, lab, { invitations: ["Ada Quay", "Mira Lantern"] });
  const [A, B] = S.inv;
  try {
    const desk = "k-" + hex(8);
    K.endInvite(S.teamsFile, S.teamId, A.made.id, "spent", desk);
    const revived = K.reviveInvite(S.teamsFile, S.teamId, A.made.id);
    const reply = await S.shell.ask("studio:desks", S.dir);
    const rows = (reply && Array.isArray(reply.invites) ? reply.invites : []);
    const rowA = rows.find((r) => r.id === A.made.id) || {}, rowB = rows.find((r) => r.id === B.made.id) || {};
    const flagged = rowA.reopened === true && rowB.reopened !== true;
    K.endInvite(S.teamsFile, S.teamId, A.made.id, "spent", desk);
    const ended = !(K.invitesOf(S.teamsFile, S.teamId).find((r) => r.id === A.made.id) || {}).reopened;
    const { loadPage } = await import("./page-stand-in.mjs");
    const Studio = await import("../src/studio.mjs");
    const open = JSON.parse(JSON.stringify(await Studio.openProject(S.dir)));
    const usedAt = Date.parse("2026-10-18T14:05:00.000Z");
    const ENT = { "&#39;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&amp;": "&" };
    const text = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m]).replace(/\s+/g, " ").trim();
    const base = { id: "", name: "", person: "", made: "2026-10-13T08:00:00.000Z", expires: "2026-10-20T08:00:00.000Z", code: "",
      relay: true, used: usedAt, deskName: "" };
    const payload = { error: null, folder: S.dir, id: "harbour-lamps", mark: null, signing: "studio-harbour", file: "ours",
      reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, requests: [], autoAdmit: false, keyOpens: true,
      inviteName: "Mira Lantern",
      invites: [Object.assign({}, base, rowA, { id: "0123456789abcdef", person: "Ada Quay", used: usedAt }),
        Object.assign({}, base, { id: "fedcba9876543210", person: "Mira Lantern" })],
      team: { id: "t-0123456789abcdef", epoch: 1, relay: true, sealed: true, lists: true, exportsSealed: true, roster: [], recovery: false, leadPrint: "abcd" } };
    const api = { desks: async () => JSON.parse(JSON.stringify(payload)) };
    const paint = async (lang) => {
      const home = loadPage({ api, uiLang: lang });
      Object.assign(home.page.S, { open, screen: "projects", home: "team", teamDir: open.dir, lang: "en" });
      await home.page.desksLoad();
      const html = String(home.node("#main").innerHTML || "");
      const of = (id) => {
        const at = html.indexOf('data-invite="' + id + '"');
        if (at < 0) return "";
        const next = html.indexOf('data-invite="', at + 1);
        return text("<x " + html.slice(at, next < 0 ? undefined : next));
      };
      return { a: of("0123456789abcdef"), b: of("fedcba9876543210") };
    };
    const en = await paint("en"), pl = await paint("pl");
    const EN = "The teammate that used it took its request back. No other teammate can use this invitation, and that one may not be able to either; a new one is the sure way in.";
    const PLs = "Członek zespołu, który z niego skorzystał, wycofał prośbę. Nikt inny nie może skorzystać z tego zaproszenia, a on być może również nie; pewną drogą jest nowe zaproszenie.";
    const enOk = en.a.indexOf(EN) >= 0 && en.a.indexOf("The relay says it was first used") < 0
      && /The relay says it was first used at/.test(en.b) && en.b.indexOf(EN) < 0;
    const plOk = pl.a.indexOf(PLs) >= 0 && pl.a.indexOf("Według przekaźnika pierwsze użycie") < 0
      && /Według przekaźnika pierwsze użycie:/.test(pl.b) && pl.b.indexOf(PLs) < 0 && pl.a.indexOf(EN) < 0;
    check(revived && flagged && ended && enOk && plOk, "rse4f a reopened invitation's Desks row says the copywriter's sentence in place of the"
      + " relay's first use, and an ordinary used row keeps it: revived " + revived + ", marked by the shell " + flagged + ", mark ended"
      + " on the next use " + ended + ", English " + enOk + ", Polish " + plOk);
  } catch (e) {
    check(false, "rse4f threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e));
  } finally { await S.shell.done(); }
};

/* rse4g: G1 (a) of the test architect's triage of the second house's review. The lead's channel fetches a desk's withdrawal while
   the watch is admitting it, after the thread wrote the team and before the shell marked the invitation spent with its desk. The
   refused set is still put right within two syncs: the withdrawn desk off the signed roster, the other desk let in beside it
   enrolled, and the invitation live again. */
LEGS.rse4g = async () => {
  const E = await e4Scene("rse4g", ["Nera Quay", "Mira Lantern"]);
  try {
    const [N, M] = E.desks, store = E.world.store(E.s.rt);
    await E.ask(N); await E.ask(M); await E.sync();
    const r = await E.admit();
    await E.withdraw(N); await E.lead();
    const fetched = !read(E.s.mirror, N.rel);
    await E.mark(r);
    let syncs = 0, done = false;
    while (syncs < 2 && !done) {
      await E.sync(); syncs++;
      const pane = await E.pane();
      done = !!store.get("dev:" + M.id) && !store.get("dev:" + N.id) && pane.roster.indexOf(N.id) < 0 && pane.roster.indexOf(M.id) >= 0;
    }
    const row = E.row(N);
    check(fetched && done && row.state === "live", "rse4g a withdrawal fetched while the watch admits, before the invitation is marked spent,"
      + " is still put right: fetched before the mark " + fetched + ", within two syncs the withdrawn desk off and the other enrolled " + done
      + " (" + syncs + " sync" + (syncs === 1 ? "" : "s") + "), the invitation " + (row.state || "none") + tail(E));
  } finally { await E.stop(); }
};

/* rse4h: G1 (b). The yes given, the desk withdraws, and the invitation's own end passes before the lead's next sync (the book reads
   it past its end, while the relay takes the withdrawal until its keep ends). Within two syncs the withdrawn desk is off the signed
   roster and its request out of the mirror and the Desks pane, and the other desk is enrolled. */
LEGS.rse4h = async () => {
  const E = await e4Scene("rse4h", ["Nera Quay", "Mira Lantern"]);
  try {
    const [N, M] = E.desks, s = E.s, store = E.world.store(s.rt);
    await E.ask(N); await E.ask(M); await E.sync();
    await E.watch();
    await E.withdraw(N);
    const atRelay = E.invRec(N).withdrawn === true;
    const book = JSON.parse(fs.readFileSync(s.teamsFile, "utf8"));
    book.teams[s.teamId].invites[N.made.id].expires = new Date(Date.now() - 60000).toISOString();
    fs.writeFileSync(s.teamsFile, JSON.stringify(book, null, 1) + "\n");
    const ended = E.row(N).state === "expired";
    let syncs = 0, done = false, pane = null;
    while (syncs < 2 && !done) {
      await E.sync(); syncs++;
      pane = await E.pane();
      done = !!store.get("dev:" + M.id) && !store.get("dev:" + N.id) && pane.roster.indexOf(N.id) < 0 && pane.roster.indexOf(M.id) >= 0;
    }
    const kept = !!read(s.mirror, N.rel), asking = !!pane && pane.asking.indexOf(N.id) >= 0;
    check(atRelay && ended && done && !kept && !asking, "rse4h a withdrawal whose invitation's own end has passed in the book is still put right:"
      + " withdrawn at the relay " + atRelay + ", past its end " + ended + ", within two syncs the withdrawn desk off and the other enrolled "
      + done + " (" + syncs + " sync" + (syncs === 1 ? "" : "s") + "), request still in the mirror " + kept + ", asking " + asking + tail(E));
  } finally { await E.stop(); }
};

/* rse4i: H2 of the test architect's read of 4df646e. A desk let in and enrolled has read its wrap and taken its request away as a member
   does, so its request is gone from the lead's mirror while its invitation's seal is still held. Then a relay that lies refuses every
   devices set as withdrawn (a third desk let in makes one) and lists a deletion by the desk's invitation that the desk never made:
   first a forged one, its own id, its signature not the desk's, served with the bytes of the desk's real request; then a file the
   desk did sign, superseding its request under its invitation's seal, that is no deletion, listed as one. Through two syncs after
   each, the desk stays on the signed roster, as only the desk's own signed deletion of its own request by its invitation takes it
   off. */
LEGS.rse4i = async () => {
  const E = await e4Scene("rse4i", ["Nera Quay", "Mira Lantern", "Pia Quay"]);
  try {
    const [N, M, P] = E.desks, s = E.s, world = E.world;
    await E.ask(N); await E.ask(M); await E.sync();
    await E.watch(); await E.sync();
    const enrolled = !!world.store(s.rt).get("dev:" + N.id);
    const row = world.entries(s.rt).filter(([k, v]) => k.startsWith("blob:") && v && v.writer === N.id && v.pub && v.del !== true).map(([, v]) => v)[0];
    const real = row ? world.recordOf(s.rt, row.id) : null;
    fs.unlinkSync(path.join(N.d.mirror, ...N.rel.split("/"))); await settle(N.d.ch);
    await E.lead();
    const readWrap = !read(s.mirror, N.rel) && !E.row(N).gone;
    await E.ask(P); await E.lead();
    await E.watch();
    const served = (r) => ({ v: 1, id: r.id, supersedes: r.supersedes == null ? null : r.supersedes, epoch: r.epoch, writer: r.writer,
      counter: r.counter, del: r.del === true, size: r.size, sig: r.sig, nonce: r.nonce, pub: r.pub });
    let forged = null;
    const pass = async (method, url, headers, body) => {
      const i = { method, headers };
      if (body && method !== "GET") i.body = body;
      const res = await world.relayFetch(url, i);
      return { status: res.status, header: (n) => res.headers.get(n), bytes: Buffer.from(await res.arrayBuffer()) };
    };
    s.t.answer = async (method, url, headers, body) => {
      const u = String(url);
      if (method === "POST" && /\/devices$/.test(u))
        return { status: 403, header: () => null, bytes: Buffer.from(JSON.stringify({ error: "withdrawn", said: "That desk has withdrawn its request, so it was not let in." })) };
      if (!forged) return null;
      if (method === "GET" && /\/since\/\d+$/.test(u)) {
        const r = await pass(method, u, headers, body);
        if (r.status !== 200) return r;
        const list = JSON.parse(r.bytes.toString("utf8"));
        const top = list.reduce((a, e) => Math.max(a, Number(e && e.seq) || 0), Number(u.split("/").pop()));
        list.push({ seq: top + 1, meta: forged.meta });
        return { status: 200, header: r.header, bytes: Buffer.from(JSON.stringify(list)) };
      }
      if (method === "GET" && u.endsWith("/b/" + forged.meta.id))
        return { status: 200, header: (n) => (n === "etiuda-blob" ? Buffer.from(JSON.stringify(forged.meta)).toString("base64url") : null), bytes: forged.ct };
      return null;
    };
    const stays = async () => {
      for (let n = 0; n < 2; n++) await E.sync();
      return (await E.pane()).roster.indexOf(N.id) >= 0;
    };
    forged = { meta: Object.assign(served(real.rec), { id: hex(16), supersedes: real.rec.id, del: true, sig: "0".repeat(128) }), ct: real.ct };
    const afterForged = await stays();
    const b = world.B.seal({ relayTeamId: s.rt, epoch: real.rec.epoch, teamKey: N.ri.seal, writer: { keyId: N.id, privateKey: N.who.privateKey },
      path: N.rel, body: "{}\n", counter: real.rec.counter + 1, supersedes: real.rec.id, place: "desk:" + N.id, kind: "file" });
    forged = { meta: { v: 1, id: b.id, supersedes: b.supersedes, epoch: b.epoch, writer: N.id, counter: b.counter, del: true,
      size: b.ciphertext.length, sig: b.signature, nonce: b.nonce, pub: N.who.pub }, ct: b.ciphertext };
    const afterRelabelled = await stays();
    check(enrolled && !!real && readWrap && afterForged && afterRelabelled, "rse4i a deletion the relay lists for a desk that never withdrew takes"
      + " it off nothing: enrolled " + enrolled + ", its request found " + !!real + ", its request gone from the mirror with its seal held " + readWrap
      + ", on the roster after a forged deletion " + afterForged + ", after a file it signed listed as a deletion " + afterRelabelled + tail(E));
  } finally { E.s.t.answer = undefined; await E.stop(); }
};

/* rse4k: the store's own rule, apart from any scene. Since the evidence rule takes the later of the store's record and the
   roster's (laterAsked, relay-small-studio), rse4j stays green with this guard lifted, so the guard is shown here: markAsked keeps
   a desk's request record only where it is later than the one kept, by epoch, then counter. */
LEGS.rse4k = async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "relay-studio-rse4k-"));
  const file = path.join(dir, "teams.json"), team = "t-" + crypto.randomBytes(8).toString("hex"), desk = "k-" + crypto.randomBytes(8).toString("hex");
  fs.writeFileSync(file, JSON.stringify({ format: 1, kind: "etiuda-studio-teams", teams: { [team]: {
    relay: { rt: crypto.randomBytes(16).toString("hex"), url: "https://relay.test/relay/v1" } } } }, null, 1) + "\n");
  const rec = (counter, epoch) => ({ id: crypto.randomBytes(16).toString("hex"), epoch: epoch || 1, counter });
  const later = rec(2), older = rec(1), equal = rec(2), newest = rec(1, 2);
  const ok = {
    first: K.markAsked(file, team, desk, later) === true,
    olderRefused: K.markAsked(file, team, desk, older) === false,
    equalRefused: K.markAsked(file, team, desk, equal) === false,
    keptLater: (K.askedOf(file, team, desk) || {}).id === later.id,
    newerEpoch: K.markAsked(file, team, desk, newest) === true && (K.askedOf(file, team, desk) || {}).id === newest.id,
  };
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* the folder is the system's to clear */ }
  check(Object.values(ok).every((v) => v === true), "rse4k the store keeps only a later request record for a desk: " + g2Line(ok));
};

/* rse4j: the replay the H2 section named. A desk withdraws, asks again on the same invitation, is let in and enrolled, and reads its
   wrap. A relay that lies then refuses a later devices set (a third desk let in makes one) and serves the desk's old withdrawal,
   genuine, signed by the desk and opening under its invitation's seal as a deletion of its request: but of the request before its
   ask again, and that older request, genuine too, served again just before it. Through two syncs the desk stays on the signed
   roster, as a withdrawal counts only where it supersedes the request that desk last asked with, and that record moves only
   forward. */
LEGS.rse4j = async () => {
  const E = await e4Scene("rse4j", ["Nera Quay", "Mira Lantern", "Pia Quay"]);
  try {
    const [N, M, P] = E.desks, s = E.s, world = E.world, store = world.store(s.rt);
    await E.ask(N); await E.ask(M); await E.sync();
    const reqRow = world.entries(s.rt).filter(([k, v]) => k.startsWith("blob:") && v && v.writer === N.id && v.pub && v.del !== true).map(([, v]) => v)[0];
    const first = reqRow ? world.recordOf(s.rt, reqRow.id) : null;
    await E.watch();
    await E.withdraw(N);
    const delRow = world.entries(s.rt).filter(([k, v]) => k.startsWith("blob:") && v && v.writer === N.id && v.pub && v.del === true).map(([, v]) => v)[0];
    const old = delRow ? world.recordOf(s.rt, delRow.id) : null;
    await E.lead(); await E.sync();
    const tookBack = E.row(N).state === "live" && !store.get("dev:" + N.id);
    await E.ask(N); await E.sync();
    await E.watch(); await E.sync();
    const back = !!store.get("dev:" + N.id) && (await E.pane()).roster.indexOf(N.id) >= 0;
    fs.unlinkSync(path.join(N.d.mirror, ...N.rel.split("/"))); await settle(N.d.ch);
    await E.lead();
    const readWrap = !read(s.mirror, N.rel) && !E.row(N).gone;
    await E.ask(P); await E.lead();
    await E.watch();
    const headOf = (r, del) => ({ v: 1, id: r.id, supersedes: r.supersedes == null ? null : r.supersedes, epoch: r.epoch,
      writer: r.writer, counter: r.counter, del, size: r.size, sig: r.sig, nonce: r.nonce, pub: r.pub });
    const meta = old ? headOf(old.rec, true) : null, firstMeta = first ? headOf(first.rec, false) : null;
    const pass = async (method, url, headers, body) => {
      const i = { method, headers };
      if (body && method !== "GET") i.body = body;
      const res = await world.relayFetch(url, i);
      return { status: res.status, header: (n) => res.headers.get(n), bytes: Buffer.from(await res.arrayBuffer()) };
    };
    s.t.answer = async (method, url, headers, body) => {
      const u = String(url);
      if (method === "POST" && /\/devices$/.test(u))
        return { status: 403, header: () => null, bytes: Buffer.from(JSON.stringify({ error: "withdrawn", said: "That desk has withdrawn its request, so it was not let in." })) };
      if (!meta) return null;
      if (method === "GET" && /\/since\/\d+$/.test(u)) {
        const r = await pass(method, u, headers, body);
        if (r.status !== 200) return r;
        const list = JSON.parse(r.bytes.toString("utf8"));
        const top = list.reduce((a, e) => Math.max(a, Number(e && e.seq) || 0), Number(u.split("/").pop()));
        if (firstMeta) list.push({ seq: top + 1, meta: firstMeta });
        list.push({ seq: top + 2, meta });
        return { status: 200, header: r.header, bytes: Buffer.from(JSON.stringify(list)) };
      }
      if (method === "GET" && u.endsWith("/b/" + meta.id))
        return { status: 200, header: (n) => (n === "etiuda-blob" ? Buffer.from(JSON.stringify(meta)).toString("base64url") : null), bytes: old.ct };
      if (firstMeta && method === "GET" && u.endsWith("/b/" + firstMeta.id))
        return { status: 200, header: (n) => (n === "etiuda-blob" ? Buffer.from(JSON.stringify(firstMeta)).toString("base64url") : null), bytes: first.ct };
      return null;
    };
    for (let n = 0; n < 2; n++) await E.sync();
    const stays = (await E.pane()).roster.indexOf(N.id) >= 0;
    check(!!first && !!old && tookBack && back && readWrap && stays, "rse4j an old genuine withdrawal served again after the desk asked anew takes it off nothing:"
      + " the first request kept " + !!first + ", the withdrawal kept " + !!old + ", taken back " + tookBack + ", asked again and enrolled " + back + ", its request gone from the mirror with"
      + " its seal held " + readWrap + ", on the roster after the replay " + stays + tail(E));
  } finally { E.s.t.answer = undefined; await E.stop(); }
};

/* Board 932 (2). The key's backup copy carries each relay team, sealed under the signing key, and a restore adds a team
   it does not already hold. A team it holds keeps that team's key, address and Sealed choice. */
const COPY_PASS = "a passphrase for this copy of the key";
const STAGING_URL = "https://etiuda.dev/relay-staging/v1";
function relayBackupRow(lead, id, rt, epoch, teamKey, secret, extra) {
  const x = extra || {};
  const channelUrl = typeof x.url === "string" && /^https:\/\//.test(x.url) ? x.url : Relay.RELAY_URL;
  let t = newTeam({ id, catalogs: ["harbour-lamps"], lead: { keyId: lead.keyId, public: lead.public }, sealed: true });
  t = withChannel(t, { kind: "relay", rt, url: channelUrl }, RING);
  t.epoch = epoch;
  t = withRecovery(t, teamKey, secret);
  const row = { team: id, rt, epoch, recovery: JSON.parse(JSON.stringify(t.recovery)) };
  if (typeof x.url === "string") row.url = x.url;
  if (typeof x.sealed === "boolean") row.sealed = x.sealed;
  return row;
}
const keySpellings = (b) => [b.toString("hex"), b.toString("base64"), b.toString("base64url")];
const backupVerbs = (Studio) => (verb, ...a) => (verb === "readBackup" || verb === "openBackup"
  ? Promise.resolve().then(() => Studio[verb](...a)) : Promise.resolve({}));

/* E1. The rows are sealed, so the file in the clear has neither address nor team, and a clear array written over the
   seal restores no row. A sealed https address is kept; anything else is the built-in relay address. */
LEGS.s932e1 = async () => {
  const Studio = await import("../src/studio.mjs");
  const lab = labDir("relay-s932e1");
  const keyAt = path.join(lab, "source-key.json"), copyAt = path.join(lab, "copy.json");
  namePassphraseFile(copyAt);
  const lead = await labLeadKey();
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  const secret = recoveryOf(keyAt, labSecret(keyAt));
  const httpUrl = "http://evil.example/relay";
  const idHttps = "t-" + hex(8), idPlain = "t-" + hex(8);
  const rtHttps = hex(16), rtPlain = hex(16);
  const keyHttps = crypto.randomBytes(32), keyPlain = crypto.randomBytes(32);
  await Studio.backupKey(copyAt, keyAt, labSecret(keyAt), COPY_PASS, { relays: [
    relayBackupRow(lead, idHttps, rtHttps, 1, keyHttps, secret, { url: STAGING_URL, sealed: true }),
    relayBackupRow(lead, idPlain, rtPlain, 1, keyPlain, secret, { url: httpUrl, sealed: false }),
  ] });
  const text = fs.readFileSync(copyAt, "utf8");
  const doc = JSON.parse(text);
  const hidden = [rtHttps, rtPlain, idHttps, idPlain, "https://", httpUrl].concat(keySpellings(keyHttps), keySpellings(keyPlain));
  const clear = hidden.every((s) => text.indexOf(s) < 0);
  const seal = !!doc.relays && !Array.isArray(doc.relays) && doc.relays.v === 1
    && typeof doc.relays.iv === "string" && typeof doc.relays.ct === "string";
  const opened = Studio.openBackup(copyAt, COPY_PASS);
  const gotHttps = opened.relays && opened.relays.find((r) => r.team === idHttps);
  const gotPlain = opened.relays && opened.relays.find((r) => r.team === idPlain);
  const openedOk = !!gotHttps && gotHttps.url === STAGING_URL && Buffer.from(gotHttps.key).equals(keyHttps) && gotHttps.sealed === true
    && !!gotPlain && gotPlain.url === undefined && Buffer.from(gotPlain.key).equals(keyPlain) && gotPlain.sealed === false
    && opened.public === lead.public;
  const evilAt = path.join(lab, "evil.json");
  const evil = JSON.parse(text);
  evil.relays = [{ team: idHttps, rt: rtHttps, epoch: 1, url: "https://evil.example/relay", sealed: false, key: keyHttps.toString("hex") }];
  fs.writeFileSync(evilAt, JSON.stringify(evil) + "\n");
  namePassphraseFile(evilAt);
  let tampered = null;
  try { tampered = Studio.openBackup(evilAt, COPY_PASS); } catch (e) { tampered = { error: String(e && e.message || e) }; }
  const tamperOk = !!tampered && !tampered.error && tampered.public === lead.public
    && !(tampered.relays || []).some((r) => r && String(r.url || "").indexOf("evil.example") >= 0);
  const ud = path.join(lab, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const shellKey = path.join(ud, "signing-key.json");
  const shell = await loadStudioShell(ud, { env: { STUDIO_SIGNING_KEY: shellKey, STUDIO_TEST_RESTORE: copyAt },
    thread: backupVerbs(Studio) });
  let back = null;
  try {
    const pick = await shell.ask("studio:key-restore-pick", "t", "k");
    back = await shell.ask("studio:key-restore", pick && pick.file, COPY_PASS);
  } finally { shell.done(); }
  const teamsFile = K.teamsFile(ud);
  const heldHttps = K.keptTeam(teamsFile, idHttps), heldPlain = K.keptTeam(teamsFile, idPlain);
  const keys = K.teamKeysOf(teamsFile, shellVault());
  const urlOk = !!(heldHttps && heldHttps.relay && heldHttps.relay.url === STAGING_URL && heldHttps.sealed === true)
    && !!(heldPlain && heldPlain.relay && heldPlain.relay.url === Relay.RELAY_URL && heldPlain.sealed === false);
  const keyOk = !!(keys[idHttps] && keys[idHttps][1] && keys[idHttps][1].equals(keyHttps))
    && !!(keys[idPlain] && keys[idPlain][1] && keys[idPlain][1].equals(keyPlain));
  const ok = { clear, seal, openedOk, tamperOk, restored: !!back && !back.error, urlOk, keyOk };
  check(Object.keys(ok).every((k) => ok[k] === true),
    "s932e1 a backup's relay rows are sealed, a clear array restores none, and only a sealed https address is kept: " + JSON.stringify(ok));
};

/* E2. A restore adds a team the profile does not hold, whole. A team it holds keeps its key, its address and its Sealed
   choice: another relay address, a folder, and the same address with a different Sealed choice and url in the copy. */
LEGS.s932e2 = async () => {
  const Studio = await import("../src/studio.mjs");
  const lab = labDir("relay-s932e2");
  const keyAt = path.join(lab, "source-key.json"), copyAt = path.join(lab, "copy.json");
  namePassphraseFile(copyAt);
  const lead = await labLeadKey();
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  const secret = recoveryOf(keyAt, labSecret(keyAt));
  const idFar = "t-" + hex(8), idFold = "t-" + hex(8), idSame = "t-" + hex(8), idNew = "t-" + hex(8);
  const rtFar = hex(16), rtFold = hex(16), rtSame = hex(16), rtNew = hex(16), rtHeld = hex(16);
  const keyFar1 = crypto.randomBytes(32), keyFar2 = crypto.randomBytes(32);
  const keyFold1 = crypto.randomBytes(32), keyFold2 = crypto.randomBytes(32);
  const keySame = crypto.randomBytes(32), keyNew = crypto.randomBytes(32);
  await Studio.backupKey(copyAt, keyAt, labSecret(keyAt), COPY_PASS, { relays: [
    relayBackupRow(lead, idFar, rtFar, 2, keyFar2, secret, { url: STAGING_URL, sealed: false }),
    relayBackupRow(lead, idFold, rtFold, 2, keyFold2, secret, { url: STAGING_URL, sealed: false }),
    relayBackupRow(lead, idSame, rtSame, 1, keySame, secret, { url: STAGING_URL, sealed: false }),
    relayBackupRow(lead, idNew, rtNew, 1, keyNew, secret, { url: STAGING_URL, sealed: true }),
  ] });
  const ud = path.join(lab, "ud");
  fs.mkdirSync(ud, { recursive: true });
  const teamsFile = K.teamsFile(ud), vault = shellVault(), share = path.join(lab, "share");
  fs.mkdirSync(share, { recursive: true });
  K.keepTeamKey(teamsFile, vault, idFar, 1, keyFar1);
  K.keepRelay(teamsFile, idFar, rtHeld, Relay.RELAY_URL);
  K.chooseSealed(teamsFile, idFar, true);
  const farFolder = K.keptTeam(teamsFile, idFar).folder;
  K.keepTeamKey(teamsFile, vault, idFold, 1, keyFold1);
  K.chooseSealed(teamsFile, idFold, true, share);
  K.keepTeamKey(teamsFile, vault, idSame, 1, keySame);
  K.keepRelay(teamsFile, idSame, rtSame, Relay.RELAY_URL);
  K.chooseSealed(teamsFile, idSame, true);
  const shellKey = path.join(ud, "signing-key.json");
  const shell = await loadStudioShell(ud, { env: { STUDIO_SIGNING_KEY: shellKey, STUDIO_TEST_RESTORE: copyAt },
    thread: backupVerbs(Studio) });
  let back = null;
  try {
    const pick = await shell.ask("studio:key-restore-pick", "t", "k");
    back = await shell.ask("studio:key-restore", pick && pick.file, COPY_PASS);
  } finally { shell.done(); }
  const far = K.keptTeam(teamsFile, idFar), fold = K.keptTeam(teamsFile, idFold);
  const same = K.keptTeam(teamsFile, idSame), born = K.keptTeam(teamsFile, idNew);
  const keys = K.teamKeysOf(teamsFile, vault);
  const epochs = (id) => Object.keys(keys[id] || {}).map(Number).sort((a, b) => a - b).join(",");
  const samePath = (a, b) => !!a && !!b && path.resolve(String(a)) === path.resolve(String(b));
  const ok = {
    back: !!back && !back.error,
    farRt: !!(far && far.relay && far.relay.rt === rtHeld && far.relay.url === Relay.RELAY_URL),
    farSealed: !!(far && far.sealed === true && samePath(far.folder, farFolder)),
    farEpochs: epochs(idFar) === "1" && !!(keys[idFar][1] && keys[idFar][1].equals(keyFar1)),
    fold: !!(fold && !fold.relay && fold.sealed === true && samePath(fold.folder, share)) && epochs(idFold) === "1",
    sameUrl: !!(same && same.relay && same.relay.rt === rtSame && same.relay.url === Relay.RELAY_URL && same.sealed === true),
    sameEpochs: epochs(idSame) === "1",
    born: !!(born && born.relay && born.relay.rt === rtNew && born.relay.url === STAGING_URL && born.sealed === true)
      && samePath(born && born.folder, K.relayMirror(teamsFile, rtNew)) && epochs(idNew) === "1"
      && !!(keys[idNew] && keys[idNew][1] && keys[idNew][1].equals(keyNew)),
  };
  check(Object.keys(ok).every((k) => ok[k] === true),
    "s932e2 a restore adds a relay team the profile does not hold and leaves one it holds as it was: " + JSON.stringify(ok)
    + (back && back.error ? " " + JSON.stringify(back.error) : ""));
};

/* The fresh profile. The copy brings the relay team back, and the shared project.json keeps the first computer's folder. */
LEGS.s932key = async () => {
  const world = await relayWorld();
  const lab = labDir("relay-s932key");
  const copyAt = path.join(lab, "key-copy.json");
  namePassphraseFile(copyAt);
  let S = null, shell2 = null;
  const ok = {};
  try {
    S = await shellLead(world, path.join(lab, "old"), { verbs: ["backupKey"], recovery: true, backupFile: copyAt });
    ok.uploaded = await until(() => !!world.store(S.rt) && !!world.store(S.rt).get("team"), 20000);
    const made = await S.shell.ask("studio:key-backup", COPY_PASS);
    await S.shell.done();
    S.shell = null;
    const teamFile = teamPath(S.mirror);
    if (fs.existsSync(teamFile)) fs.renameSync(teamFile, teamFile + ".aside");
    const text = fs.existsSync(copyAt) ? fs.readFileSync(copyAt, "utf8") : "";
    const doc = text ? JSON.parse(text) : {};
    ok.backed = !!made && !made.error && !!text;
    ok.clear = !!text && [S.rt, S.teamId, "https://"].concat(keySpellings(S.teamKey)).every((s) => text.indexOf(s) < 0);
    ok.seal = !!doc.relays && !Array.isArray(doc.relays) && doc.relays.v === 1 && typeof doc.relays.ct === "string";
    const ud = path.join(lab, "new-ud");
    fs.mkdirSync(ud, { recursive: true });
    const projects = path.join(lab, "new-projects"), projName = path.basename(S.dir), dir = path.join(projects, projName);
    fs.cpSync(S.dir, dir, { recursive: true });
    const pj = path.join(dir, "project.json");
    const project = JSON.parse(fs.readFileSync(pj, "utf8"));
    const folderBefore = project.folder;
    project.sealedTeam = S.teamId;
    project.relay = { rt: S.rt, url: Relay.RELAY_URL, lead: S.lead.public };
    fs.writeFileSync(pj, JSON.stringify(project, null, 1) + "\n");
    const keyAt = path.join(ud, "signing-key.json");
    const Studio = await import("../src/studio.mjs");
    shell2 = await loadStudioShell(ud, { relay: world.transport("s932-new"), thread: (verb, ...a) => (
      verb === "readBackup" || verb === "openBackup" || verb === "teamFacts" || verb === "teamKeyBack"
        ? Promise.resolve().then(() => Studio[verb](...a)) : Promise.resolve({})),
      env: { STUDIO_PROJECTS: projects, STUDIO_SIGNING_KEY: keyAt,
        STUDIO_RELAY_ROOT: GRANT_ROOT_PUB, STUDIO_TEST_RESTORE: copyAt } });
    const pick = await shell2.ask("studio:key-restore-pick", "t", "k");
    const back = await shell2.ask("studio:key-restore", pick && pick.file, COPY_PASS);
    const teamsFile = K.teamsFile(ud), mirror = K.relayMirror(teamsFile, S.rt);
    const held = K.keptTeam(teamsFile, S.teamId);
    const keys = K.teamKeysOf(teamsFile, shellVault());
    ok.restored = !!back && !back.error;
    ok.address = !!(held && held.relay && held.relay.rt === S.rt && held.relay.url === Relay.RELAY_URL);
    ok.key = !!(keys[S.teamId] && keys[S.teamId][1] && keys[S.teamId][1].equals(S.teamKey));
    ok.sealed = !!(held && held.sealed === true);
    ok.mirror = await until(() => fs.existsSync(mirror), 20000);
    const desks = await shell2.ask("studio:desks", dir);
    const after = JSON.parse(fs.readFileSync(pj, "utf8"));
    ok.project = after.folder === folderBefore;
    ok.desks = !!desks && !desks.error && path.resolve(String(desks.folder || "")) === path.resolve(mirror);
    if (!ok.restored && back && back.error) ok.said = back.error;
  } finally {
    if (S && S.shell) S.shell.done();
    if (shell2) shell2.done();
  }
  check(Object.keys(ok).every((k) => ok[k] === true),
    "s932key a fresh profile restores each relay team from the key's backup copy, and the shared project keeps the first computer's folder: "
    + JSON.stringify(ok));
};

/* Board 932 (6): the relay's refusal of a background sync is said for that team. The copywriter's sentences, character
   for character (2026-10-28). */
const RS932 = {
  "team-size": {
    en: "The relay did not take the latest sync: this team's space there is full, at most 4096 files. Nothing on this computer is lost, and the team keeps the catalog it has. Write to us through etiuda.dev.",
    pl: "Przekaźnik nie przyjął ostatniej synchronizacji: miejsce tego zespołu jest pełne, mieści najwyżej 4096 plików. Na tym komputerze nic nie przepadło, a zespół pracuje dalej z katalogiem, który ma. Prosimy o wiadomość przez etiuda.dev.",
  },
  "out-of-step": {
    en: "The relay did not take this computer's latest upload, because it arrived out of step with the team. Nothing on this computer is lost, and Studio sends it again at its next look; nothing needs doing.",
    pl: "Przekaźnik nie przyjął ostatniej wysyłki z tego komputera, bo nie zgadzała się z bieżącym stanem zespołu. Na tym komputerze nic nie przepadło, a Studio wyśle ją ponownie przy następnym sprawdzeniu; nic nie trzeba robić.",
  },
  "out-of-step-3": {
    en: "The relay has refused this computer's uploads three times in a row as out of step with the team. Nothing on this computer is lost, but the relay's copy does not yet have this computer's latest. A newer version of Studio may set this right: look on etiuda.dev, and if it continues after that, write to us there.",
    pl: "Przekaźnik już trzy razy z rzędu odrzucił wysyłki z tego komputera, bo nie zgadzały się z bieżącym stanem zespołu. Na tym komputerze nic nie przepadło, ale kopia na przekaźniku nie ma jeszcze najnowszych zmian z tego komputera. Pomóc może nowsza wersja Studia: warto zajrzeć na etiuda.dev, a jeśli i z nią to się powtarza, prosimy o wiadomość przez tę stronę.",
  },
  rate: {
    en: "The relay is taking fewer uploads for a moment, as there were many in a short time. Nothing is lost, and Studio sends again shortly by itself; nothing needs doing.",
    pl: "Przekaźnik chwilowo przyjmuje mniej wysyłek, bo w krótkim czasie było ich wiele. Nic nie przepadło, a Studio wkrótce samo wyśle je ponownie; nic nie trzeba robić.",
  },
};

LEGS.rs932 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs932");
  const s = await studioLead(world, lab);
  const row = () => K.relayTeams(s.teamsFile).find((w) => w.team === s.teamId) || null;
  const note = () => { const r = row(); return r && r.syncNote ? r.syncNote : ""; };
  const streak = () => { const r = row(); return r && Number.isSafeInteger(r.syncStreak) ? r.syncStreak : 0; };
  let n = 0;
  const owe = () => { n += 1; fs.writeFileSync(path.join(s.mirror, "quay-note-" + n + ".txt"), "note " + n + "\n"); };
  const look = async () => { await s.runner.sync(); await s.runner.idle(); };
  const refuse = (error, status) => {
    s.t.answer = async (method, url) => {
      if (method === "PUT" && /\/b\/[0-9a-f]{32}(?:$|\?)/.test(String(url)))
        return { status, header: () => null, bytes: Buffer.from(JSON.stringify({ error: error, said: "x" })) };
      return null;
    };
  };
  const seen = [];
  const snap = (name) => { seen.push(name + "=" + note() + "/" + streak()); };
  const got = {};
  try {
    await look();
    snap("made");
    owe();
    refuse("bad-signature", 403);
    await look();
    snap("sig");
    got.first = note() === "out-of-step" && streak() === 1;
    s.t.answer = null;
    await look();
    snap("reset");
    got.reset = note() === "" && streak() === 0;
    owe();
    refuse("replay-counter", 409);
    await look();
    snap("counter");
    got.again = note() === "out-of-step" && streak() === 1;
    refuse("epoch", 409);
    await look();
    snap("epoch");
    got.second = note() === "out-of-step" && streak() === 2;
    refuse("bad-signature", 403);
    await look();
    snap("third");
    got.third = note() === "out-of-step-3" && streak() === 3;
    refuse("team-size", 403);
    await look();
    snap("size");
    got.size = note() === "team-size" && streak() === 3;
    refuse("rate", 429);
    await look();
    snap("rate");
    got.rate = note() === "rate" && streak() === 3;
    s.t.answer = null;
    await look();
    snap("clear");
    got.clear = note() === "" && streak() === 0;
  } finally { s.t.answer = null; await s.runner.stop(); }
  const enc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const { loadPage } = await import("./page-stand-in.mjs");
  const mirror = s.mirror;
  const pageBad = [];
  for (const lang of ["en", "pl"]) {
    for (const kind of ["team-size", "out-of-step", "out-of-step-3", "rate"]) {
      const home = loadPage({ api: {}, uiLang: lang }), P = home.page;
      Object.assign(P.S, { open: { dir: "C:/quay", draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [],
        project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
        host: { tour: { offered: true } }, screen: "projects", home: "team", teamDir: "C:/quay", cover: null, err: null, dkNote: null, q: "",
        desks: { team: { id: s.teamId, epoch: 1, relay: true, roster: [], sealed: true }, folder: mirror, file: "ours", requests: [], syncNote: kind } });
      P.paintMain();
      const html = home.node("#main").innerHTML;
      const words = RS932[kind][lang];
      if (html.indexOf(enc(words)) < 0 || html.indexOf('data-sync-note="' + kind + '"') < 0) pageBad.push(lang + " " + kind);
    }
  }
  got.page = pageBad.length === 0;
  const world2 = await relayWorld(), lab2 = labDir("relay-rs932-shell"), R = await leadAtRest(lab2, "Lantern Quay");
  world2.R.clock.now = Date.now();
  const t = world2.transport("shell");
  const thread = async (verb, ...a) => (verb === "listProjects" ? R.S.listProjects(...a) : R.thread(verb, ...a));
  const shell = await loadStudioShell(R.ud, { relay: t, env: R.env, thread });
  try {
    await shell.ask("studio:team-relay", R.proj);
    const uploaded = await until(() => {
      const rec = K.relayTeams(R.teamsFile)[0];
      return !!rec && rec.created === true && t.log.some((l) => l.indexOf("PUT ") === 0 && l.indexOf("b/") >= 0);
    }, 20000);
    await wait(1000);
    t.down = true;
    const rec = K.relayTeams(R.teamsFile)[0];
    if (rec) K.markRelay(R.teamsFile, rec.team, { syncNote: "rate", syncStreak: 2 });
    const desks = await shell.ask("studio:desks", R.proj);
    got.desks = uploaded && !!desks && desks.syncNote === "rate";
  } finally { shell.done(); }
  const bad = Object.keys(got).filter((k) => got[k] !== true);
  check(bad.length === 0, "rs932 a refused background sync is said on the Desks screen for that team, three out-of-step looks in a row say the second line, a success between resets it, and a success clears it: "
    + (bad.length ? "failing " + bad.join(", ") + " (" + seen.join(" ") + "); page " + pageBad.join(", ") : "every part holds"));
};

/* Board 932 (6): an unknown refusal or a refusal with no error string, EN and PL. */
const RS932_UNKNOWN = {
  withoutError: {
    en: "The relay did not take the latest sync and gave no reason. Nothing on this computer is lost, and Studio tries again at its next look; nothing needs doing now. If it lasts, write to us through etiuda.dev with the relay's answer: {STATUS}.",
    pl: "Przekaźnik nie przyjął ostatniej synchronizacji i nie podał powodu. Na tym komputerze nic nie przepadło, a Studio spróbuje ponownie przy następnym sprawdzeniu; teraz nic nie trzeba robić. Jeśli to się utrzymuje, prosimy o wiadomość przez etiuda.dev z odpowiedzią przekaźnika: {STATUS}.",
  },
  withError: {
    en: "The relay did not take the latest sync and gave no reason Studio recognises. Nothing on this computer is lost, and Studio tries again at its next look; nothing needs doing now. If it lasts, write to us through etiuda.dev with the relay's answer: {STATUS} {ERROR}.",
    pl: "Przekaźnik nie przyjął ostatniej synchronizacji i nie podał powodu, który Studio rozpoznaje. Na tym komputerze nic nie przepadło, a Studio spróbuje ponownie przy następnym sprawdzeniu; teraz nic nie trzeba robić. Jeśli to się utrzymuje, prosimy o wiadomość przez etiuda.dev z odpowiedzią przekaźnika: {STATUS} {ERROR}.",
  },
};

LEGS.rs932u = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs932u");
  const s = await studioLead(world, lab);
  const row = () => K.relayTeams(s.teamsFile).find((w) => w.team === s.teamId) || null;
  const note = () => { const r = row(); return r && r.syncNote ? r.syncNote : ""; };
  let n = 0;
  const owe = () => { n += 1; fs.writeFileSync(path.join(s.mirror, "quay-note-" + n + ".txt"), "note " + n + "\n"); };
  const look = async () => { await s.runner.sync(); await s.runner.idle(); };
  const refuse = (error, status) => {
    s.t.answer = async (method, url) => {
      if (method === "PUT" && /\/b\/[0-9a-f]{32}(?:$|\?)/.test(String(url))) {
        const body = error ? { error: error, said: "x" } : {};
        return { status, header: () => null, bytes: Buffer.from(JSON.stringify(body)) };
      }
      return null;
    };
  };
  const seen = [];
  const got = {};
  try {
    await look();
    owe();
    refuse("", 500);
    await look();
    seen.push("noError=" + note());
    got.noError = note() === "refused:500";
    owe();
    await look();
    seen.push("noErrorAgain=" + note());
    got.noErrorAgain = note() === "refused:500";
    s.t.answer = null;
    await look();
    seen.push("clear1=" + note());
    got.clear1 = note() === "";

    owe();
    refuse("strange-fault", 403);
    await look();
    seen.push("withError=" + note());
    got.withError = note() === "refused:403:strange-fault";
    owe();
    await look();
    seen.push("withErrorAgain=" + note());
    got.withErrorAgain = note() === "refused:403:strange-fault";
    s.t.answer = null;
    await look();
    seen.push("clear2=" + note());
    got.clear2 = note() === "";

    owe();
    let helloCount = 0;
    s.t.answer = async (method, url) => {
      if (method === "PUT" && /\/b\/[0-9a-f]{32}(?:$|\?)/.test(String(url))) {
        if (helloCount === 0) {
          helloCount += 1;
          return { status: 401, header: () => null, bytes: Buffer.from(JSON.stringify({ error: "no-hello", said: "x" })) };
        }
      }
      return null;
    };
    await look();
    seen.push("noHello=" + note());
    got.noHello = note() === "" && helloCount === 1;
    s.t.answer = null;
    await look();

    owe();
    refuse("x".repeat(200), 500);
    await look();
    seen.push("longError=" + note());
    got.longError = note() === "refused:500";
    s.t.answer = null;
    await look();

    owe();
    refuse('odd error with <spaces>&quotes"', 502);
    await look();
    seen.push("oddError=" + note());
    got.oddError = note() === "refused:502";
    s.t.answer = null;
    await look();
  } finally { s.t.answer = null; await s.runner.stop(); }

  const enc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const { loadPage } = await import("./page-stand-in.mjs");
  const mirror = s.mirror;
  const pageBad = [];
  const countNotes = (html) => (html.match(/data-sync-note=/g) || []).length;

  for (const lang of ["en", "pl"]) {
    {
      const kind = "refused:500";
      const home = loadPage({ api: {}, uiLang: lang }), P = home.page;
      Object.assign(P.S, { open: { dir: "C:/quay", draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [],
        project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
        host: { tour: { offered: true } }, screen: "projects", home: "team", teamDir: "C:/quay", cover: null, err: null, dkNote: null, q: "",
        desks: { team: { id: s.teamId, epoch: 1, relay: true, roster: [], sealed: true }, folder: mirror, file: "ours", requests: [], syncNote: kind } });
      P.paintMain();
      const html = home.node("#main").innerHTML;
      const filled = home.sandbox.STUDIO_T.T(RS932_UNKNOWN.withoutError[lang], { STATUS: 500 });
      if (html.indexOf(enc(filled)) < 0 || html.indexOf('data-sync-note="' + kind + '"') < 0) pageBad.push(lang + " " + kind);
      if (countNotes(html) !== 1) pageBad.push(lang + " " + kind + " count=" + countNotes(html));
    }
    {
      const kind = "refused:403:strange-fault";
      const home = loadPage({ api: {}, uiLang: lang }), P = home.page;
      Object.assign(P.S, { open: { dir: "C:/quay", draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [],
        project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
        host: { tour: { offered: true } }, screen: "projects", home: "team", teamDir: "C:/quay", cover: null, err: null, dkNote: null, q: "",
        desks: { team: { id: s.teamId, epoch: 1, relay: true, roster: [], sealed: true }, folder: mirror, file: "ours", requests: [], syncNote: kind } });
      P.paintMain();
      const html = home.node("#main").innerHTML;
      const filled = home.sandbox.STUDIO_T.T(RS932_UNKNOWN.withError[lang], { STATUS: 403, ERROR: "strange-fault" });
      if (html.indexOf(enc(filled)) < 0 || html.indexOf('data-sync-note="' + kind + '"') < 0) pageBad.push(lang + " " + kind);
      if (countNotes(html) !== 1) pageBad.push(lang + " " + kind + " count=" + countNotes(html));
    }
    {
      const kind = 'refused:502:<bad&"evil\'>';
      const home = loadPage({ api: {}, uiLang: lang }), P = home.page;
      Object.assign(P.S, { open: { dir: "C:/quay", draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [],
        project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
        host: { tour: { offered: true } }, screen: "projects", home: "team", teamDir: "C:/quay", cover: null, err: null, dkNote: null, q: "",
        desks: { team: { id: s.teamId, epoch: 1, relay: true, roster: [], sealed: true }, folder: mirror, file: "ours", requests: [], syncNote: kind } });
      P.paintMain();
      const html = home.node("#main").innerHTML;
      if (html.indexOf("<bad") >= 0 || html.indexOf("&evil") >= 0) pageBad.push(lang + " unescaped markup");
    }
  }
  got.page = pageBad.length === 0;

  const bad = Object.keys(got).filter((k) => got[k] !== true);
  check(bad.length === 0, "rs932u an unknown refusal with no error string and one with an error string each put their line on Desks in both languages, repeat does not duplicate, a 401 no-hello leaves no note, a 200-character or odd error records status alone, and a success clears it: "
    + (bad.length ? "failing " + bad.join(", ") + " (" + seen.join(" ") + "); page " + pageBad.join(", ") : "every part holds"));
};

/* Board 932, team-count: one lead key holds at most 25 live teams. The relay answers the create with HTTP 403 and
   {error: "team-count"}. Make a team and Start a new team here both reach the same handler, which says the copywriter's
   sentence and leaves nothing behind. */
const RS932_COUNT = {
  en: "This team was not made: this Studio's signing key already holds 25 teams on the relay, the most it may. A place frees when the relay deletes a team's copy after its licence ends, or write to us through etiuda.dev. Nothing on the team's computers or in Studio was changed.",
  pl: "Nie utworzono zespołu: klucz podpisu tego Studia ma już na przekaźniku 25 zespołów, czyli najwięcej, ile może. Miejsce zwalnia się, gdy przekaźnik usunie kopię zespołu po wygaśnięciu jego licencji; można też napisać do nas przez etiuda.dev. Nic na komputerach zespołu ani w Studiu się nie zmieniło.",
};

LEGS.rs932c = async () => {
  const world = await relayWorld(), lab = labDir("relay-rs932c"), R = await leadAtRest(lab, "Lantern Quay");
  world.R.clock.now = Date.now();
  const t = world.transport("shell");
  t.answer = async (method, url) => {
    const pathOnly = String(url).split("?")[0];
    if (method === "POST" && /\/teams$/.test(pathOnly))
      return { status: 403, header: () => null, bytes: Buffer.from(JSON.stringify({ error: "team-count" })) };
    return null;
  };
  const shell = await loadStudioShell(R.ud, { relay: t, env: R.env, thread: R.thread });
  let reply = null;
  try {
    if (teamRelayHandler(shell)) reply = await shell.ask("studio:team-relay", R.proj);
  } finally { await shell.done(); }
  const book = (() => { try { return Object.keys(JSON.parse(fs.readFileSync(R.teamsFile, "utf8")).teams || {}); } catch { return []; } })();
  const project = R.projectJson();
  const left = {
    asked: t.log.some((l) => l.indexOf("POST ") === 0 && l.indexOf("teams") >= 0),
    said: !!reply && !!reply.said && reply.said.frame === RS932_COUNT.en,
    error: !!reply && reply.error === RS932_COUNT.en,
    teams: K.relayTeams(R.teamsFile).length === 0,
    book: book.length === 0,
    place: project.folder == null && !project.sealedTeam && !project.relay,
  };
  const enc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const { loadPage } = await import("./page-stand-in.mjs");
  const pageBad = [];
  const api = { teamRelay: async () => ({ error: RS932_COUNT.en, said: { frame: RS932_COUNT.en, vars: {} } }) };
  try {
    for (const lang of ["en", "pl"]) {
      for (const how of ["make", "fresh"]) {
        const home = loadPage({ api, uiLang: lang }), P = home.page;
        const desks = how === "fresh"
          ? { folder: "C:/quay/share", file: "theirs", lead: "87ad0879ac3e9ff6", signing: "studio-0123456789abcdef", requests: [], canKeep: true, team: null }
          : { folder: null, file: "none", signing: "studio-0123456789abcdef", requests: [], canKeep: true, team: null };
        Object.assign(P.S, { open: { dir: "C:/quay", draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [],
          project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
          host: { tour: { offered: true } }, screen: "projects", home: "team", teamDir: "C:/quay", cover: null, err: null, dkNote: null, q: "",
          desks, teamWant: "", teamWhere: "folder" });
        try { if (how === "fresh") P.ACTS["team-fresh"](); else P.ACTS["team-make"](); }
        catch { /* a full paint the stand-in does not finish; the want is already set */ }
        /* The lead chooses the relay on the cover: team-count is a relay create's answer, and a real folder was
           the cover's default until 2026-11-20, when the relay became the only default. */
        P.S.teamWhere = "relay";
        try { await P.ACTS["do-team-seal"](); } catch { /* paintCover may not finish; the dialog is what is read */ }
        const html = home.node("#dlg").innerHTML;
        const words = lang === "pl" ? RS932_COUNT.pl : RS932_COUNT.en;
        if (html.indexOf(enc(words)) < 0) pageBad.push(lang + " " + how);
      }
    }
  } catch (e) { pageBad.push("threw " + String(e && e.message || e)); }
  const bad = Object.keys(left).filter((k) => left[k] !== true);
  check(bad.length === 0 && pageBad.length === 0, "rs932c a create the relay refuses as team-count says the copywriter's sentence, for Make a team and for Start a new team here, in English and in Polish, and leaves nothing behind: "
    + (bad.length || pageBad.length ? "failing " + bad.join(", ") + " (" + JSON.stringify(reply && { error: reply.error, frame: reply.said && reply.said.frame }) + "); page " + pageBad.join(", ") : "every part holds"));
};

const HANDOVER_REFUSAL_GONE = "The relay no longer keeps this team, as its licence has ended, so it was not handed over and nothing changed. To go on with the new key, sign in with an account that holds a licence, from the Menu, under Settings, then Account, and start a new team here on the Team screen.";
const HANDOVER_REFUSAL_NOGRANT = "The licence service gave no licence for the new key, so the team was not handed over and stays as it was, under the old key. Signing in again moves the licence to the new key: Use another account, under the Menu, Settings, then Account, signs in afresh, with the same account or another. Then hand the team over again, and if that is refused too, write to us through etiuda.dev.";
const HANDOVER_REFUSAL_COUNT = "The new signing key already leads 25 teams on the relay, the most it may, so this team was not handed over and stays as it was, under the old key. A place frees when the relay deletes a team's copy after its licence ends, or write to us through etiuda.dev.";
const HANDOVER_REFUSAL_CATCHALL = "The relay did not take the handover just now, so the team stays as it was, under the old key. Nothing is lost; hand the team over again shortly.";

LEGS.rsho_b = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsho-b"), R = await leadAtRest(lab, "Lantern Quay");
  const thread = (verb, ...a) => (verb in R.S ? R.S[verb](...a) : {});
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("shell-a"), env: R.env, thread });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { await shellA.done(); }
  if (!recA) { check(false, "rsho_b setup did not create relay team"); return; }

  /* Set aside old key and make new key */
  const oldKeyFile = path.join(R.ud, "signing-key.old.json");
  fs.renameSync(R.keyAt, oldKeyFile);
  const newKeyDoc = await labLeadKey();
  fs.writeFileSync(R.keyAt, JSON.stringify(newKeyDoc, null, 1) + "\n");
  granted(R.keyAt, newKeyDoc.public);

  /* Now open Studio and run handover */
  const t = world.transport("shell-b");
  const shellB = await loadStudioShell(R.ud, { relay: t, env: R.env, thread });
  let res = null;
  try {
    res = await shellB.ask("studio:team-handover", R.proj);
    await until(() => {
      const row = world.store(recA.rt).get("team");
      return row && row.lead && row.lead.pub === newKeyDoc.public;
    }, 20000);
  } finally { await shellB.done(); }

  const relayRow = world.store(recA.rt).get("team");
  const teamDoc = (await heldTeam(recA.folder, { key: R.keyAt })).team;
  const genuine = Engine.relayRules().blob.handoverGenuine(teamDoc.handover[0], recA.team, R.made);

  /* Check that old key session is dropped / refused */
  const oldLeadOpen = unlockKey(readKeyFile(oldKeyFile), labSecret(oldKeyFile));
  const ch = JSON.parse((await t.request("POST", Relay.RELAY_URL + "/t/" + recA.rt + "/hello", {}, Buffer.from("{}"))).bytes.toString()).challenge;
  const oldSes = await t.request("POST", Relay.RELAY_URL + "/t/" + recA.rt + "/session", { "content-type": "application/json" },
    Buffer.from(JSON.stringify({ challenge: ch, key: oldLeadOpen.keyId, pub: oldLeadOpen.public, sig: crypto.sign(null, world.C.helloBytes(recA.rt, ch, oldLeadOpen.keyId), oldLeadOpen.privateKey).toString("hex") })));
  const oldErr = JSON.parse(oldSes.bytes.toString()).error;
  const ok = {
    moved: relayRow && relayRow.lead && relayRow.lead.pub === newKeyDoc.public,
    genuine: genuine === true,
    leadDoc: teamDoc && teamDoc.lead && teamDoc.lead.public === newKeyDoc.public,
    oldRefused: oldSes && (oldSes.status === 400 || oldSes.status === 403) && (oldErr === "not-enrolled" || oldErr === "bad-signature"),
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "rsho_b relay handover moves relay lead, uploads under new key session, refuses old key session: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

LEGS.rsho_c = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsho-c"), R = await leadAtRest(lab, "Lantern Quay");
  const thread = (verb, ...a) => (verb in R.S ? R.S[verb](...a) : {});
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("shell-a"), env: R.env, thread });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { await shellA.done(); }

  /* Set aside old key and make new key */
  const oldKeyFile = path.join(R.ud, "signing-key.old.json");
  fs.renameSync(R.keyAt, oldKeyFile);
  const newKeyDoc = await labLeadKey();
  fs.writeFileSync(R.keyAt, JSON.stringify(newKeyDoc, null, 1) + "\n");
  const grant = granted(R.keyAt, newKeyDoc.public);

  /* First move lead directly on relay to simulate step (ii) having already succeeded */
  const oldOpen = unlockKey(readKeyFile(oldKeyFile), labSecret(oldKeyFile));
  const t0 = Date.now();
  const C = Engine.relayRules().core;
  const sig = crypto.sign(null, C.leadBytes(recA.rt, newKeyDoc.keyId, newKeyDoc.public, t0), oldOpen.privateKey).toString("hex");
  const t = world.transport("shell-c");
  const moveRes = await t.request("POST", Relay.RELAY_URL + "/t/" + recA.rt + "/lead", { "content-type": "application/json" },
    Buffer.from(JSON.stringify({ to: { keyId: newKeyDoc.keyId, pub: newKeyDoc.public }, t: t0, sig, grant })));
  if (moveRes.status !== 200) { check(false, "rsho_c step ii simulation failed"); return; }

  /* Write profile studio.json with step: "(iii)" */
  const storePath = path.join(R.ud, "studio.json");
  const storeData = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
  storeData.handover = {
    team: recA.team, projectDir: R.proj, folder: recA.folder, kind: "relay", rt: recA.rt, url: Relay.RELAY_URL,
    step: "(iii)", oldKeyFile, oldPub: R.made.public, newPub: newKeyDoc.public, newKeyId: newKeyDoc.keyId
  };
  fs.writeFileSync(storePath, JSON.stringify(storeData, null, 1) + "\n");

  /* Now start Studio. It should resume at step (iii) without calling POST /lead again */
  t.log.length = 0;
  const shellB = await loadStudioShell(R.ud, { relay: t, env: R.env, thread });
  try {
    await until(() => {
      const s = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
      return !s.handover;
    }, 20000);
  } finally { await shellB.done(); }

  const leadCalls = t.log.filter((l) => l.indexOf("/lead") >= 0);
  const finalStore = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
  const teamDoc = (await heldTeam(recA.folder, { key: R.keyAt })).team;

  const ok = {
    noLeadCall: leadCalls.length === 0,
    handoverCleared: !finalStore.handover,
    docUpdated: teamDoc && teamDoc.lead && teamDoc.lead.public === newKeyDoc.public,
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "rsho_c crash after (ii) resumes at (iii) without calling (ii) again: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

/* BOARD 984: A HANDOVER PARKED AT STEP (iii) FOR WANT OF THE OLD KEY, AND THE OLD KEY'S BACKUP COPY RESTORED. The relay team is made
   under the old key, a backup copy of the old key is made outside the profile, the old key is set aside and a new one made, the
   relay's lead is moved as step (ii) moves it, and the record stands at step (iii) naming the old key's file, which is then gone
   from the computer. Studio starts, finds the old key gone and parks the handover (handoverNeedsOldKey). What each part restores,
   and what it reads after, is its own; b984c makes no handover record at all. */
async function b984Parked(name, o) {
  const x = o || {};
  const world = await relayWorld(), lab = labDir("relay-" + name), R = await leadAtRest(lab, "Lantern Quay");
  const thread = (verb, ...a) => (verb in R.S ? R.S[verb](...a) : {});
  const tA = world.transport("shell-a");
  const shellA = await loadStudioShell(R.ud, { relay: tA, env: R.env, thread });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { await shellA.done(); }
  /* The setup shell's start goes on after its window opens, its own resume of a handover among it, and done() does not wait
     for that; a resume of it that comes late reads the record written below and, with the old key kept (b984e), would finish
     the handover through this transport (measured: 7 of 17 runs before this line, 0 of 10 after). Its relay is taken away,
     so a late resume stays at step (ii). */
  if (x.keepOld) tA.down = true;
  if (!recA) return { why: "setup did not make the relay team" };
  const oldCopy = path.join(lab, "old-key-backup.json");
  await R.S.backupKey(oldCopy, R.keyAt, labSecret(R.keyAt), PASS, {});
  namePassphraseFile(oldCopy);
  const oldKeyFile = path.join(R.ud, "signing-key.old.json");
  fs.renameSync(R.keyAt, oldKeyFile);
  const newKeyDoc = await labLeadKey();
  fs.writeFileSync(R.keyAt, JSON.stringify(newKeyDoc, null, 1) + "\n");
  const grant = granted(R.keyAt, newKeyDoc.public);
  const storePath = path.join(R.ud, "studio.json");
  const readStoreNow = () => (fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {});
  if (x.handover !== false && x.step === "(ii)") {
    /* Parked at step (ii): the relay has not taken the lead yet, so the resume still calls it before the team file is signed. */
    const storeData = readStoreNow();
    storeData.handover = { team: recA.team, projectDir: R.proj, folder: recA.folder, kind: "relay", rt: recA.rt, url: Relay.RELAY_URL,
      step: "(ii)", oldKeyFile, oldPub: R.made.public, newPub: newKeyDoc.public, newKeyId: newKeyDoc.keyId, t: Date.now(), grant,
      reason: "new-computer" };
    fs.writeFileSync(storePath, JSON.stringify(storeData, null, 1) + "\n");
  } else if (x.handover !== false) {
    const oldOpen = unlockKey(readKeyFile(oldKeyFile), labSecret(oldKeyFile));
    const t0 = Date.now(), C = Engine.relayRules().core;
    const sig = crypto.sign(null, C.leadBytes(recA.rt, newKeyDoc.keyId, newKeyDoc.public, t0), oldOpen.privateKey).toString("hex");
    const moveRes = await world.transport("move").request("POST", Relay.RELAY_URL + "/t/" + recA.rt + "/lead", { "content-type": "application/json" },
      Buffer.from(JSON.stringify({ to: { keyId: newKeyDoc.keyId, pub: newKeyDoc.public }, t: t0, sig, grant })));
    if (moveRes.status !== 200) return { why: "step (ii) was not taken by the relay stand-in (" + moveRes.status + ")" };
    const storeData = readStoreNow();
    storeData.handover = { team: recA.team, projectDir: R.proj, folder: recA.folder, kind: "relay", rt: recA.rt, url: Relay.RELAY_URL,
      step: "(iii)", oldKeyFile, oldPub: R.made.public, newPub: newKeyDoc.public, newKeyId: newKeyDoc.keyId, reason: "new-computer" };
    fs.writeFileSync(storePath, JSON.stringify(storeData, null, 1) + "\n");
  }
  /* The old key's file goes from the computer: moved out of the profile, so nothing Studio reads finds it. b984e keeps it. */
  if (!x.keepOld) fs.renameSync(oldKeyFile, path.join(lab, "old-key-gone.json"));
  return { world, lab, R, thread, recA, oldCopy, oldKeyFile, newKeyDoc, storePath, readStoreNow };
}
/* A restore through the shell, as the page makes it: the copy picked (STUDIO_TEST_RESTORE answers the dialog), then opened by
   its passphrase. */
async function b984Restore(shell, pass) {
  const picked = await shell.ask("studio:key-restore-pick", "t", "k");
  return shell.ask("studio:key-restore", picked && picked.file, pass);
}
/* Every file in the profile but studio.json, by name and sha256; the store is read field by field where it matters. */
const b984Listing = (dir) => fs.readdirSync(dir).filter((f) => f !== "studio.json").sort().map((f) => {
  const at = path.join(dir, f);
  return f + ":" + (fs.statSync(at).isFile() ? crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") : "dir");
}).join("|");
const B984_REFUSED = "This Studio keeps another signing key, so the copy was not restored.";
const b984Parks = (readStoreNow) => until(() => { const h = readStoreNow().handover; return !!(h && h.needs); }, 20000);
const b984Clears = (readStoreNow) => until(() => !readStoreNow().handover, 20000);

LEGS.b984a = async () => {
  const w = await b984Parked("b984a");
  if (w.why) { check(false, "b984a " + w.why); return; }
  const { world, R, thread, recA, oldCopy, newKeyDoc, readStoreNow } = w;
  /* Step (iii) is held at the thread until the key's place has been read after the restore, so the byte for byte reading is the
     restore's alone; step (iii)'s own team write then adds the lead's box to the key file, as any handover's does, and leaves
     every field it had as it was. */
  let letGo = null, held = false;
  const gate = new Promise((r) => { letGo = r; });
  const gated = async (verb, ...a) => { if (verb === "handoverTeam") { held = true; await gate; } return thread(verb, ...a); };
  const shell = await loadStudioShell(R.ud, { relay: world.transport("shell-b"), env: Object.assign({}, R.env, { STUDIO_TEST_RESTORE: oldCopy }), thread: gated });
  let parked = false, reply = null, keyBefore = null, keyAfter = null, heldAtRead = false, cleared = false, desksAfter = null;
  try {
    parked = await b984Parks(readStoreNow);
    keyBefore = fs.readFileSync(R.keyAt);
    /* The restore's reply may wait for step (iii), so the key is read while step (iii) is held and the reply taken after. */
    const asked = b984Restore(shell, PASS);
    await until(() => held, 10000);
    heldAtRead = held;
    keyAfter = fs.readFileSync(R.keyAt);
    letGo();
    reply = await asked;
    cleared = await b984Clears(readStoreNow);
    desksAfter = await shell.ask("studio:desks", R.proj);
  } finally { letGo(); await shell.done(); }
  /* The page, in English and in Polish, given that reply: the restore's press on the key's cover, then the project's Desks screen
     says the handover's own ending, as it does after the press of Hand over. */
  const { loadPage } = await import("./page-stand-in.mjs");
  const enc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ENDED = { en: "The team is handed to the new signing key. The team follows it on its own, with nothing to do; the old key stays set aside on this computer." };
  const said = {};
  for (const lang of ["en", "pl"]) {
    try {
      const home = loadPage({ api: { keyRestore: async () => JSON.parse(JSON.stringify(reply || {})),
        desks: async () => JSON.parse(JSON.stringify(desksAfter || {})) }, uiLang: lang }), P = home.page;
      const want = lang === "en" ? ENDED.en : P.T(ENDED.en);
      Object.assign(P.S, {
        open: { dir: R.proj, draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [], project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
        host: { tour: { offered: true } }, screen: "projects", home: "team", teamDir: R.proj, cover: "key", keyWant: "restore", keyCopy: { file: oldCopy, print: "" },
        err: null, dkNote: null, q: "" });
      await P.ACTS["do-key-restore"]();
      P.paintMain();
      const html = home.node("#main").innerHTML;
      said[lang] = html.indexOf("data-handover-done") >= 0 && html.indexOf(enc(want)) >= 0 && (lang === "en" || want !== ENDED.en);
    } catch (e) { said[lang] = false; }
  }
  const was = JSON.parse(keyBefore.toString("utf8")), now = readKeyFile(R.keyAt).doc;
  const fieldsKept = Object.keys(was).every((k) => JSON.stringify(now[k]) === JSON.stringify(was[k]))
    && Object.keys(now).filter((k) => !(k in was)).join(",") === "box";
  const store = readStoreNow();
  const kept = (Array.isArray(store.oldSigningKeys) ? store.oldSigningKeys : []).filter((e) => e && e.public === R.made.public);
  const aside = kept.length === 1 && fs.existsSync(kept[0].file) ? readKeyFile(kept[0].file) : null;
  const teamDoc = (await heldTeam(recA.folder, { key: R.keyAt })).team;
  const genuine = teamDoc && teamDoc.handover && teamDoc.handover[0]
    ? Engine.relayRules().blob.handoverGenuine(teamDoc.handover[0], recA.team, R.made) : false;
  const ok = {
    parked,
    restored: !!reply && !reply.error,
    keyByteForByte: heldAtRead && !!keyBefore && !!keyAfter && keyBefore.equals(keyAfter) && was.public === newKeyDoc.public,
    keyFieldsKept: fieldsKept,
    keptAside: !!aside && aside.public === R.made.public && aside.kept === OS_WRAP && path.dirname(kept[0].file) === path.dirname(R.keyAt),
    handoverCleared: cleared,
    teamFileSigned: !!(teamDoc && teamDoc.lead && teamDoc.lead.public === newKeyDoc.public) && genuine === true,
    endingSaidEn: said.en === true,
    endingSaidPl: said.pl === true,
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "b984a a handover parked at step (iii) with its old key gone takes the old key's backup copy:"
    + " the key in place stays byte for byte through the restore, the old key is kept aside, the team file is signed and the record cleared,"
    + " and the Desks screen then says the handover's ending in English and in Polish: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + (reply && reply.error ? " (" + JSON.stringify(reply.error).slice(0, 160) + ")" : ""));
};

/* b984d, a handover parked at step (ii) with its old key gone, restored with the relay off line: each call the shell makes to it
   is held B984_OFF_MS and then fails, as a call does that the wire's idle limit ends (30 s in src/wire.cjs; shorter here, the
   shape is the same). Step (ii) calls the relay before the record clears, so a restore that waits for the handover sits through
   those calls. The restore's reply comes within B984_CAP_MS with the old key kept aside; the handover cannot end off line and
   stays at step (ii), naming the file kept aside. At the next start, the relay answering, it ends, and the Desks screen then
   says its ending once, by the flag the press of Hand over sets. */
const B984_OFF_MS = 6000, B984_CAP_MS = 5000;
LEGS.b984d = async () => {
  const w = await b984Parked("b984d", { step: "(ii)" });
  if (w.why) { check(false, "b984d " + w.why); return; }
  const { world, R, thread, recA, oldCopy, newKeyDoc, readStoreNow } = w;
  const tOff = world.transport("shell-off");
  let offCalls = 0;
  tOff.answer = async () => { offCalls++; await wait(B984_OFF_MS); throw new Error("the lab's relay did not answer"); };
  const shell = await loadStudioShell(R.ud, { relay: tOff, env: Object.assign({}, R.env, { STUDIO_TEST_RESTORE: oldCopy }), thread });
  let started = false, reply = null, replyMs = -1, stillAtIi = false, asideNamed = false;
  try {
    /* The start's own resume and sync have run once the sync's line is said (it follows the resume at start). */
    started = await until(() => shell.said.some((l) => /relay of team|relay could not/.test(l)), 30000);
    const t0 = Date.now();
    reply = await b984Restore(shell, PASS);
    replyMs = Date.now() - t0;
    /* The handover goes on behind the reply; off line it fails at step (ii). Its calls are waited out before the shell stops. */
    await wait(3 * B984_OFF_MS);
    const h = readStoreNow().handover;
    stillAtIi = !!(h && h.step === "(ii)");
    asideNamed = !!(h && h.oldKeyFile && fs.existsSync(h.oldKeyFile) && readKeyFile(h.oldKeyFile).public === R.made.public);
  } finally { await shell.done(); }
  /* The next start, the relay answering. */
  const shellOn = await loadStudioShell(R.ud, { relay: world.transport("shell-on"), env: R.env, thread });
  let cleared = false, desksAfter = null, desksAgain = null;
  try {
    cleared = await until(() => !readStoreNow().handover, 30000);
    await until(() => readStoreNow().handoverDone === R.proj, 10000);
    desksAfter = await shellOn.ask("studio:desks", R.proj);
    desksAgain = await shellOn.ask("studio:desks", R.proj);
    await shellSettled(shellOn);
  } finally { await shellOn.done(); }
  const teamDoc = (await heldTeam(recA.folder, { key: R.keyAt })).team;
  const { loadPage } = await import("./page-stand-in.mjs");
  const enc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ENDED = "The team is handed to the new signing key. The team follows it on its own, with nothing to do; the old key stays set aside on this computer.";
  let pageSays = false;
  try {
    const home = loadPage({ api: { desks: async () => JSON.parse(JSON.stringify(desksAfter || {})) }, uiLang: "en" }), P = home.page;
    Object.assign(P.S, {
      open: { dir: R.proj, draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [], project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
      host: { tour: { offered: true } }, screen: "projects", home: "team", teamDir: R.proj, cover: null, err: null, dkNote: null, q: "" });
    await P.desksLoad();
    P.paintMain();
    const html = home.node("#main").innerHTML;
    pageSays = html.indexOf("data-handover-done") >= 0 && html.indexOf(enc(ENDED)) >= 0;
  } catch { pageSays = false; }
  const ok = {
    started,
    restored: !!reply && !reply.error && !reply.handoverDone,
    withinCap: replyMs >= 0 && replyMs < B984_CAP_MS + 1500,
    offLine: offCalls > 0 && stillAtIi && asideNamed,
    endedAtNextStart: cleared && !!(teamDoc && teamDoc.lead && teamDoc.lead.public === newKeyDoc.public),
    endingCarriedOnce: !!desksAfter && desksAfter.handoverDone === R.proj && !!desksAgain && !desksAgain.handoverDone,
    pageSays,
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "b984d a handover parked at step (ii), restored with the relay off line: the reply comes within "
    + B984_CAP_MS + " ms with the old key aside, the handover ends at the next start and the Desks screen then says its ending once: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ") + " (reply " + replyMs + " ms)");
};

LEGS.b984b = async () => {
  const w = await b984Parked("b984b");
  if (w.why) { check(false, "b984b " + w.why); return; }
  const { world, lab, R, thread, oldCopy, readStoreNow } = w;
  const third = path.join(lab, "third-key-backup.json"), thirdKey = path.join(lab, "third-key.json");
  fs.writeFileSync(thirdKey, JSON.stringify(await labLeadKey(), null, 1) + "\n");
  await R.S.backupKey(third, thirdKey, labSecret(thirdKey), PASS, {});
  namePassphraseFile(third);
  const shell = await loadStudioShell(R.ud, { relay: world.transport("shell-b"), env: Object.assign({}, R.env, { STUDIO_TEST_RESTORE: third }), thread });
  let parked = false, refused = null, before = "", after = "", hoBefore = "", hoAfter = "", oldBefore = "", oldAfter = "", second = null, cleared = false;
  try {
    parked = await b984Parks(readStoreNow);
    before = b984Listing(R.ud); hoBefore = JSON.stringify(readStoreNow().handover); oldBefore = JSON.stringify(readStoreNow().oldSigningKeys || null);
    refused = await b984Restore(shell, PASS);
    after = b984Listing(R.ud); hoAfter = JSON.stringify(readStoreNow().handover); oldAfter = JSON.stringify(readStoreNow().oldSigningKeys || null);
    /* The same parked state then takes the old key's own copy, so the refusal above is the third key's and not every copy's. */
    process.env.STUDIO_TEST_RESTORE = oldCopy;
    second = await b984Restore(shell, PASS);
    cleared = await b984Clears(readStoreNow);
  } finally { await shell.done(); }
  const ok = {
    parked,
    refusedAsToday: !!refused && !!refused.error && JSON.stringify(refused.error).indexOf(B984_REFUSED) >= 0,
    nothingWritten: !!before && before === after && hoBefore === hoAfter && oldBefore === oldAfter,
    oldCopyThenTaken: !!second && !second.error && cleared,
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "b984b the same parked handover refuses a copy of a third key as today and writes nothing,"
    + " and then takes the old key's copy: " + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

LEGS.b984c = async () => {
  const w = await b984Parked("b984c", { handover: false });
  if (w.why) { check(false, "b984c " + w.why); return; }
  const { world, R, thread, oldCopy, readStoreNow } = w;
  const shell = await loadStudioShell(R.ud, { relay: world.transport("shell-b"), env: Object.assign({}, R.env, { STUDIO_TEST_RESTORE: oldCopy }), thread });
  let refused = null, before = "", after = "", oldBefore = "", oldAfter = "";
  try {
    before = b984Listing(R.ud); oldBefore = JSON.stringify(readStoreNow().oldSigningKeys || null);
    refused = await b984Restore(shell, PASS);
    after = b984Listing(R.ud); oldAfter = JSON.stringify(readStoreNow().oldSigningKeys || null);
  } finally { await shell.done(); }
  const ok = {
    noHandover: !readStoreNow().handover,
    refusedAsToday: !!refused && !!refused.error && JSON.stringify(refused.error).indexOf(B984_REFUSED) >= 0,
    nothingWritten: !!before && before === after && oldBefore === oldAfter,
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "b984c with no handover under way, the old key's copy over a signing key that has signed is refused"
    + " as today and writes nothing: " + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

/* b984e, a handover under way that is not waiting for its old key: parked at step (ii) with the relay off line, the file it
   recorded for the old key still on the computer and opening. The old key's copy is then no handover's want, so the restore
   refuses it as any restore over a key that has signed, and writes nothing: no second copy aside, the record as it was. Each
   call to the relay fails at once, so the handover stays at step (ii) through the restore. */
LEGS.b984e = async () => {
  const w = await b984Parked("b984e", { step: "(ii)", keepOld: true });
  if (w.why) { check(false, "b984e " + w.why); return; }
  const { world, R, thread, oldCopy, oldKeyFile, readStoreNow } = w;
  const tOff = world.transport("shell-off");
  let offCalls = 0;
  tOff.answer = async () => { offCalls++; throw new Error("the lab's relay did not answer"); };
  const shell = await loadStudioShell(R.ud, { relay: tOff, env: Object.assign({}, R.env, { STUDIO_TEST_RESTORE: oldCopy }), thread });
  let started = false, refused = null, before = "", after = "", hoBefore = "", hoAfter = "", oldBefore = "", oldAfter = "", facts = null;
  try {
    started = await until(() => shell.said.some((l) => /relay of team|relay could not/.test(l)), 30000);
    /* No handover waits for the old key here, so Settings' Signing key row is not told to offer its restore. */
    facts = await shell.ask("studio:signing");
    before = b984Listing(R.ud); hoBefore = JSON.stringify(readStoreNow().handover); oldBefore = JSON.stringify(readStoreNow().oldSigningKeys || null);
    refused = await b984Restore(shell, PASS);
    /* Anything the restore set going would write within this; the resume's own calls fail at once. */
    await wait(1500);
    after = b984Listing(R.ud); hoAfter = JSON.stringify(readStoreNow().handover); oldAfter = JSON.stringify(readStoreNow().oldSigningKeys || null);
  } finally { await shell.done(); }
  const h = JSON.parse(hoAfter || "null");
  const ok = {
    started,
    underWayAtIi: offCalls > 0 && !!h && h.step === "(ii)" && h.oldKeyFile === oldKeyFile,
    recordedOpens: fs.existsSync(oldKeyFile) && readKeyFile(oldKeyFile).public === R.made.public,
    rowNotAsked: !!facts && !!facts.signing && !!facts.signing.keyId && !("oldKeyWanted" in facts.signing),
    refusedAsToday: !!refused && !!refused.error && JSON.stringify(refused.error).indexOf(B984_REFUSED) >= 0,
    nothingWritten: !!before && before === after && hoBefore === hoAfter && oldBefore === oldAfter,
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "b984e a handover under way whose recorded old key still opens refuses the old key's copy as"
    + " today and writes nothing: " + Object.keys(ok).map((k) => k + " " + ok[k]).join(", ")
    + (ok.nothingWritten ? "" : " (step before " + (JSON.parse(hoBefore || "null") || {}).step + "; files " + (before === after ? "same" : "differ") + "; calls " + tOff.log.join(" ") + ")"));
};

/* b984f, the person's own path, through the page. A handover parked at step (iii) for want of its old key, the new key in the
   key's place kept by the operating system, as every key Studio makes is. The Desks screen's line sends the person to the
   Menu, Settings, then Signing key, to restore the old key's backup copy (src/relay.mjs HANDOVER_OLD_KEY_SAID); that row
   offers a restore otherwise only where there is no key, or the key opens with a passphrase. So the row must offer it while
   the handover waits. Pressed as the page presses it, the copy picked and its passphrase typed, the handover ends, the page
   holds its ending for the Desks screen, and the row then offers the restore no longer, the key the same. */
LEGS.b984f = async () => {
  const w = await b984Parked("b984f");
  if (w.why) { check(false, "b984f " + w.why); return; }
  const { world, R, thread, oldCopy, newKeyDoc, readStoreNow } = w;
  const shell = await loadStudioShell(R.ud, { relay: world.transport("shell-b"), env: Object.assign({}, R.env, { STUDIO_TEST_RESTORE: oldCopy }), thread });
  const { loadPage } = await import("./page-stand-in.mjs");
  let parked = false, keptByOs = false, oncePassphrase = false, rowBefore = "", pressed = false, cleared = false, endingHeld = false, rowAfter = "", sameKey = false;
  try {
    parked = await b984Parks(readStoreNow);
    const api = {
      keyRestorePick: (title, kind) => shell.ask("studio:key-restore-pick", title, kind),
      keyRestore: (file, pass) => shell.ask("studio:key-restore", file, pass),
    };
    const home = loadPage({ api, uiLang: "en" }), P = home.page;
    const facts = await shell.ask("studio:signing");
    keptByOs = !!facts && !!facts.signing && facts.signing.kept === OS_WRAP && facts.signing.public === newKeyDoc.public;
    P.S.host = { signing: facts && facts.signing };
    const row = P.__get("signingRowHtml");
    /* The same facts with a key that opens with a passphrase: its own line offers the restore, and the row not a second. */
    P.S.host = { signing: Object.assign({}, facts && facts.signing, { kept: "passphrase" }) };
    oncePassphrase = (row().match(/data-act="key-restore"/g) || []).length === 1;
    P.S.host = { signing: facts && facts.signing };
    rowBefore = row();
    if (/data-act="key-restore"/.test(rowBefore)) {
      await P.ACTS["key-restore"]();
      home.node("#keyPass").value = PASS;
      await P.ACTS["do-key-restore"]();
      pressed = !P.S.err && P.S.cover === null;
    }
    cleared = await b984Clears(readStoreNow);
    endingHeld = P.S.handoverDone === R.proj;
    rowAfter = row();
    sameKey = !!P.S.host.signing && P.S.host.signing.public === newKeyDoc.public;
  } finally { await shell.done(); }
  const ok = {
    parked,
    keptByOs,
    rowOffersRestore: /data-act="key-restore"/.test(rowBefore),
    oncePassphrase,
    pressed,
    cleared,
    endingHeld,
    rowOffersItNoLonger: !!rowAfter && !/data-act="key-restore"/.test(rowAfter) && /data-act="key-aside"/.test(rowAfter),
    sameKey,
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "b984f a handover parked for its old key: Settings' Signing key row offers the restore, the press"
    + " through the page ends the handover, and the row then offers it no longer: " + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

LEGS.rsho_c2 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsho-c2"), R = await leadAtRest(lab, "Lantern Quay");
  const thread = (verb, ...a) => (verb in R.S ? R.S[verb](...a) : {});
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("shell-a"), env: R.env, thread });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { await shellA.done(); }

  /* Set aside old key and make new key */
  const oldKeyFile = path.join(R.ud, "signing-key.old.json");
  fs.renameSync(R.keyAt, oldKeyFile);
  const newKeyDoc = await labLeadKey();
  fs.writeFileSync(R.keyAt, JSON.stringify(newKeyDoc, null, 1) + "\n");
  const grant = granted(R.keyAt, newKeyDoc.public);

  /* Write profile studio.json with step: "(ii)" (crash between new key write and ii) */
  const storePath = path.join(R.ud, "studio.json");
  const storeData = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
  storeData.handover = {
    team: recA.team, projectDir: R.proj, folder: recA.folder, kind: "relay", rt: recA.rt, url: Relay.RELAY_URL,
    step: "(ii)", oldKeyFile, oldPub: R.made.public, newPub: newKeyDoc.public, newKeyId: newKeyDoc.keyId,
    t: Date.now(), grant
  };
  fs.writeFileSync(storePath, JSON.stringify(storeData, null, 1) + "\n");

  /* Now start Studio. It should resume with the SAME new key */
  const t = world.transport("shell-c2");
  const shellB = await loadStudioShell(R.ud, { relay: t, env: R.env, thread });
  try {
    await until(() => {
      const s = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
      return !s.handover;
    }, 20000);
  } finally { await shellB.done(); }

  const relayRow = world.store(recA.rt).get("team");
  const finalStore = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
  const teamDoc = (await heldTeam(recA.folder, { key: R.keyAt })).team;

  const ok = {
    sameKey: relayRow && relayRow.lead && relayRow.lead.pub === newKeyDoc.public,
    handoverCleared: !finalStore.handover,
    docUpdated: teamDoc && teamDoc.lead && teamDoc.lead.public === newKeyDoc.public,
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "rsho_c2 K4 crash between new key write and (ii) resumes with same new key: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

LEGS.rsho_c3 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsho-c3"), R = await leadAtRest(lab, "Lantern Quay");
  const thread = (verb, ...a) => (verb in R.S ? R.S[verb](...a) : {});
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("shell-a"), env: R.env, thread });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { await shellA.done(); }
  if (!recA) { check(false, "rsho_c3 setup did not create relay team"); return; }

  /* Set aside old key and make new key */
  const oldKeyFile = path.join(R.ud, "signing-key.old.json");
  fs.renameSync(R.keyAt, oldKeyFile);
  const newKeyDoc = await labLeadKey();
  fs.writeFileSync(R.keyAt, JSON.stringify(newKeyDoc, null, 1) + "\n");
  granted(R.keyAt, newKeyDoc.public);

  /* Open Studio and start handover with transport dropping the reply at step (ii) after the stand-in takes the move */
  const tB = world.transport("shell-b");
  let moveLanded = false;
  tB.answer = async (method, url, headers, body) => {
    const pathOnly = String(url).split("?")[0];
    if (method === "POST" && /\/lead$/.test(pathOnly)) {
      const res = await world.relayFetch(url, { method, headers, body });
      moveLanded = res.status === 200;
      throw new Error("lost connection");
    }
    return null;
  };

  const shellB = await loadStudioShell(R.ud, { relay: tB, env: R.env, thread });
  let handoverErr = null;
  try {
    handoverErr = await shellB.ask("studio:team-handover", R.proj);
  } catch (e) {
    handoverErr = e;
  } finally {
    await shellB.done();
  }

  const storePath = path.join(R.ud, "studio.json");
  const storeAfterDrop = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};

  /* Studio restarts: resumeHandover runs */
  const tC = world.transport("shell-c");
  const shellC = await loadStudioShell(R.ud, { relay: tC, env: R.env, thread });
  try {
    await until(() => {
      const s = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
      return !s.handover;
    }, 20000);
  } finally {
    await shellC.done();
  }

  /* Verify handover finished */
  const relayRow = world.store(recA.rt).get("team");
  const finalStore = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
  const teamDoc = (await heldTeam(recA.folder, { key: R.keyAt })).team;
  const genuine = teamDoc && teamDoc.handover && teamDoc.handover[0]
    ? Engine.relayRules().blob.handoverGenuine(teamDoc.handover[0], recA.team, R.made)
    : false;
  const desksFollow = teamDoc ? Engine.relayRules().blob.handedTo(teamDoc, R.made) === true : false;

  const ok = {
    moveLanded: moveLanded === true,
    keptAtStepIi: !!(storeAfterDrop.handover && storeAfterDrop.handover.step === "(ii)"),
    relayMoved: !!(relayRow && relayRow.lead && relayRow.lead.pub === newKeyDoc.public),
    handoverCleared: !finalStore.handover,
    docUpdated: !!(teamDoc && teamDoc.lead && teamDoc.lead.public === newKeyDoc.public),
    genuine: genuine === true,
    desksFollow: desksFollow === true,
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "rsho_c3 move lands, reply dropped, restart resumes (iii), desks follow: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};
LEGS.rsho_e1 = LEGS.rsho_c3;

LEGS.rsho_c4 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsho-c4"), R = await leadAtRest(lab, "Lantern Quay");
  const thread = (verb, ...a) => (verb in R.S ? R.S[verb](...a) : {});
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("shell-a"), env: R.env, thread });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { await shellA.done(); }
  if (!recA) { check(false, "rsho_c4 setup did not create relay team"); return; }

  /* Set aside old key and make new key */
  const oldKeyFile = path.join(R.ud, "signing-key.old.json");
  fs.renameSync(R.keyAt, oldKeyFile);
  const newKeyDoc = await labLeadKey();
  fs.writeFileSync(R.keyAt, JSON.stringify(newKeyDoc, null, 1) + "\n");
  granted(R.keyAt, newKeyDoc.public);

  /* Write handover record with step: "(ii)" and t more than 5 minutes in the past */
  const storePath = path.join(R.ud, "studio.json");
  const storeData = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
  const staleT = Date.now() - 6 * 60 * 1000;
  storeData.handover = {
    team: recA.team,
    projectDir: R.proj,
    folder: recA.folder,
    kind: "relay",
    rt: recA.rt,
    url: Relay.RELAY_URL,
    step: "(ii)",
    oldKeyFile,
    oldPub: R.made.public,
    newPub: newKeyDoc.public,
    newKeyId: newKeyDoc.keyId,
    t: staleT,
    grant: Relay.readGrant(R.keyAt)
  };
  fs.writeFileSync(storePath, JSON.stringify(storeData, null, 1) + "\n");

  /* Studio starts: resumeHandover runs */
  const tC = world.transport("shell-c");
  const shellC = await loadStudioShell(R.ud, { relay: tC, env: R.env, thread });
  try {
    await until(() => {
      const s = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
      return !s.handover;
    }, 20000);
  } finally {
    await shellC.done();
  }

  /* Verify handover finished */
  const relayRow = world.store(recA.rt).get("team");
  const finalStore = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
  const teamDoc = (await heldTeam(recA.folder, { key: R.keyAt })).team;
  const genuine = teamDoc && teamDoc.handover && teamDoc.handover[0]
    ? Engine.relayRules().blob.handoverGenuine(teamDoc.handover[0], recA.team, R.made)
    : false;
  const desksFollow = teamDoc ? Engine.relayRules().blob.handedTo(teamDoc, R.made) === true : false;

  const ok = {
    staleWouldRefuse: !Engine.relayRules().core.isFresh(staleT, Date.now()),
    relayMoved: !!(relayRow && relayRow.lead && relayRow.lead.pub === newKeyDoc.public),
    handoverCleared: !finalStore.handover,
    docUpdated: !!(teamDoc && teamDoc.lead && teamDoc.lead.public === newKeyDoc.public),
    genuine: genuine === true,
    desksFollow: desksFollow === true,
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "rsho_c4 resume past 5 minutes reaches relay with fresh t and completes: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};
LEGS.rsho_c1a = LEGS.rsho_c4;

LEGS.rsho_c5 = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsho-c5"), R = await leadAtRest(lab, "Lantern Quay");
  const thread = (verb, ...a) => (verb in R.S ? R.S[verb](...a) : {});
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("shell-a"), env: R.env, thread });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { await shellA.done(); }
  if (!recA) { check(false, "rsho_c5 setup did not create relay team"); return; }

  const oldKeyFile = path.join(R.ud, "signing-key.old.json");
  fs.renameSync(R.keyAt, oldKeyFile);
  const newKeyDoc = await labLeadKey();
  fs.writeFileSync(R.keyAt, JSON.stringify(newKeyDoc, null, 1) + "\n");
  granted(R.keyAt, newKeyDoc.public);

  const storePath = path.join(R.ud, "studio.json");
  const storeData = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
  storeData.handover = {
    team: recA.team,
    projectDir: R.proj,
    folder: recA.folder,
    kind: "relay",
    rt: recA.rt,
    url: Relay.RELAY_URL,
    step: "(ii)",
    oldKeyFile,
    oldPub: R.made.public,
    newPub: newKeyDoc.public,
    newKeyId: newKeyDoc.keyId,
    t: Date.now(),
    grant: Relay.readGrant(R.keyAt)
  };
  fs.writeFileSync(storePath, JSON.stringify(storeData, null, 1) + "\n");

  /* Transport answers definite refusal team-count to POST /lead */
  const tB = world.transport("shell-b");
  tB.answer = async (method, url) => {
    const pathOnly = String(url).split("?")[0];
    if (method === "POST" && /\/lead$/.test(pathOnly)) {
      return { status: 403, header: () => null, bytes: Buffer.from(JSON.stringify({ error: "team-count" })) };
    }
    return null;
  };

  const shellB = await loadStudioShell(R.ud, { relay: tB, env: R.env, thread });
  let desks1 = null, desks2 = null, storeAfterDrop = null, storeAfterFirstDesks = null;
  try {
    await until(() => {
      const s = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
      return !s.handover;
    }, 20000);
    storeAfterDrop = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};

    /* Desks facts carry the refusal sentence once */
    desks1 = await shellB.ask("studio:desks", R.proj);
    storeAfterFirstDesks = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};

    /* Second read carries it not again */
    desks2 = await shellB.ask("studio:desks", R.proj);
  } finally {
    await shellB.done();
  }

  /* Also verify ui/app.js page stand-in shows data-handover-ended in English and Polish */
  const { loadPage } = await import("./page-stand-in.mjs");
  const enc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pageChecks = [];
  for (const lang of ["en", "pl"]) {
    const home = loadPage({ api: {}, uiLang: lang }), P = home.page;
    Object.assign(P.S, {
      open: { dir: R.proj, draft: { langs: [{ code: "en", name: "English" }], cards: [] }, editions: [], project: { rev: 0 }, counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0 } },
      host: { tour: { offered: true } }, screen: "projects", home: "team", teamDir: R.proj, cover: null, err: null, dkNote: null, q: "",
      desks: { team: { id: recA.team, epoch: 1, relay: true, roster: [], sealed: true }, folder: recA.folder, file: "ours", requests: [], handoverEnded: HANDOVER_REFUSAL_COUNT }
    });
    P.paintMain();
    const html = home.node("#main").innerHTML;
    const translated = lang === "pl"
      ? "Nowy klucz podpisu prowadzi już na przekaźniku 25 zespołów, czyli najwięcej, ile może, więc tego zespołu nie przekazano; zostaje bez zmian, przy starym kluczu. Miejsce zwalnia się, gdy przekaźnik usunie kopię zespołu po wygaśnięciu jego licencji; można też napisać do nas przez etiuda.dev."
      : HANDOVER_REFUSAL_COUNT;
    const hasAttr = html.indexOf("data-handover-ended") >= 0;
    const hasText = html.indexOf(enc(translated)) >= 0;
    pageChecks.push(hasAttr && hasText);
  }

  const ok = {
    recordDeleted: !storeAfterDrop.handover,
    keptInStore: storeAfterDrop.handoverEnded === HANDOVER_REFUSAL_COUNT,
    carriedOnce: desks1 && desks1.handoverEnded === HANDOVER_REFUSAL_COUNT,
    clearedFromStore: !storeAfterFirstDesks.handoverEnded,
    notAgain: desks2 && !desks2.handoverEnded,
    pageBothLangs: pageChecks.every(Boolean),
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "rsho_c5 resume refused definitely (team-count) deletes record, Desks carries sentence once then not again: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};
LEGS.rsho_c1b = LEGS.rsho_c5;

LEGS.rsho_e = async () => {
  const world = await relayWorld(), lab = labDir("relay-rsho-e"), R = await leadAtRest(lab, "Lantern Quay");
  const thread = (verb, ...a) => (verb in R.S ? R.S[verb](...a) : {});
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("shell-a"), env: R.env, thread });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { await shellA.done(); }

  const oldKeyFile = path.join(R.ud, "signing-key.old.json");
  fs.renameSync(R.keyAt, oldKeyFile);
  const newKeyDoc = await labLeadKey();
  fs.writeFileSync(R.keyAt, JSON.stringify(newKeyDoc, null, 1) + "\n");
  granted(R.keyAt, newKeyDoc.public);

  const teamBefore = read(recA.folder, "etiuda-team.json");
  const ringBefore = fs.existsSync(path.join(recA.folder, "etiuda-ring.json")) ? read(recA.folder, "etiuda-ring.json") : "";
  const storePath = path.join(R.ud, "studio.json");

  const cases = [
    { error: "not-enrolled", said: HANDOVER_REFUSAL_GONE },
    { error: "bad-grant", said: HANDOVER_REFUSAL_NOGRANT },
    { error: "team-count", status: 403, said: HANDOVER_REFUSAL_COUNT },
    { error: "nonce-stale", said: HANDOVER_REFUSAL_CATCHALL },
  ];

  const results = [];
  for (const c of cases) {
    const t = world.transport("shell-e-" + c.error);
    t.answer = async (method, url) => {
      const pathOnly = String(url).split("?")[0];
      if (method === "POST" && /\/lead$/.test(pathOnly)) {
        return { status: c.status || 400, header: () => null, bytes: Buffer.from(JSON.stringify({ error: c.error })) };
      }
      return null;
    };
    const shell = await loadStudioShell(R.ud, { relay: t, env: R.env, thread });
    let err = null;
    try {
      err = await shell.ask("studio:team-handover", R.proj);
    } catch (e) { err = e; }
    finally { await shell.done(); }

    const storeAfter = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {};
    const teamAfter = read(recA.folder, "etiuda-team.json");
    const ringAfter = fs.existsSync(path.join(recA.folder, "etiuda-ring.json")) ? read(recA.folder, "etiuda-ring.json") : "";

    const matchesSaid = err && (err.message === c.said || (err.error && err.error === c.said) || (err.said && err.said.frame === c.said));
    const profileClean = !storeAfter.handover;
    const teamUntouched = teamAfter === teamBefore;
    const ringUntouched = ringAfter === ringBefore;
    results.push({ case: c.error, matchesSaid: !!matchesSaid, profileClean, teamUntouched, ringUntouched });
  }

  const allOk = results.every(r => r.matchesSaid && r.profileClean && r.teamUntouched && r.ringUntouched);
  check(allOk, "rsho_e each refusal at (ii) leaves profile, team file and ring untouched under old key and shows its sentence: "
    + results.map(r => r.case + " (said=" + r.matchesSaid + ", team=" + r.teamUntouched + ", prof=" + r.profileClean + ")").join("; "));
};

/* THE LEAD BOX FOLLOWS THE HANDOVER'S REASON (Max's ruling of 2026-11-01 06:13), through the shell. A relay team made under the
   old key, which carries a box, is handed to a new key with none. */
async function leadBoxWorld(tag) {
  const world = await relayWorld(), lab = labDir("relay-" + tag), R = await leadAtRest(lab, "Lantern Quay");
  const thread = (verb, ...a) => (verb in R.S ? R.S[verb](...a) : {});
  const shellA = await loadStudioShell(R.ud, { relay: world.transport("shell-a"), env: R.env, thread });
  let recA = null;
  try {
    if (teamRelayHandler(shellA)) await shellA.ask("studio:team-relay", R.proj);
    recA = K.relayTeams(R.teamsFile)[0] || null;
    if (recA) await until(() => !!world.store(recA.rt) && !!world.store(recA.rt).get("team"), 20000);
  } finally { await shellA.done(); }
  if (!recA) return null;
  const oldBox = openLeadBox(readKeyFile(R.keyAt), unlockKey(readKeyFile(R.keyAt), labSecret(R.keyAt)));
  const oldKeyFile = path.join(R.ud, "signing-key.old.json");
  fs.renameSync(R.keyAt, oldKeyFile);
  const newKeyDoc = await labLeadKey();
  fs.writeFileSync(R.keyAt, JSON.stringify(newKeyDoc, null, 1) + "\n");
  const grant = granted(R.keyAt, newKeyDoc.public);
  const storePath = path.join(R.ud, "studio.json");
  const store = () => (fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf8")) : {});
  const newBox = () => { try { return openLeadBox(readKeyFile(R.keyAt), unlockKey(readKeyFile(R.keyAt), labSecret(R.keyAt))); } catch { return null; } };
  return { world, R, thread, recA, oldBox, oldKeyFile, newKeyDoc, grant, storePath, store, newBox };
}

/* rslb_k: a handover for a new computer, cut off after the relay took the move (step (iii) recorded with its reason), resumes at
   the next start for the same reason: the new key carries the team's box and the team file names it, and no desk is kept as left
   behind. */
LEGS.rslb_k = async () => {
  const w = await leadBoxWorld("rslb-k");
  if (!w) { check(false, "rslb_k setup did not create relay team"); return; }
  const { world, R, thread, recA, oldBox, oldKeyFile, newKeyDoc, grant, storePath, store, newBox } = w;
  const oldOpen = unlockKey(readKeyFile(oldKeyFile), labSecret(oldKeyFile));
  const t0 = Date.now(), C = Engine.relayRules().core;
  const sig = crypto.sign(null, C.leadBytes(recA.rt, newKeyDoc.keyId, newKeyDoc.public, t0), oldOpen.privateKey).toString("hex");
  const t = world.transport("shell-lbk");
  const moved = await t.request("POST", Relay.RELAY_URL + "/t/" + recA.rt + "/lead", { "content-type": "application/json" },
    Buffer.from(JSON.stringify({ to: { keyId: newKeyDoc.keyId, pub: newKeyDoc.public }, t: t0, sig, grant })));
  if (moved.status !== 200) { check(false, "rslb_k the relay did not take the move: " + moved.status); return; }
  const data = store();
  data.handover = { team: recA.team, projectDir: R.proj, folder: recA.folder, kind: "relay", rt: recA.rt, url: Relay.RELAY_URL,
    step: "(iii)", oldKeyFile, oldPub: R.made.public, newPub: newKeyDoc.public, newKeyId: newKeyDoc.keyId, reason: "new-computer" };
  fs.writeFileSync(storePath, JSON.stringify(data, null, 1) + "\n");
  const shellB = await loadStudioShell(R.ud, { relay: t, env: R.env, thread });
  try { await until(() => !store().handover, 20000); } finally { await shellB.done(); }
  const teamDoc = (await heldTeam(recA.folder, { key: R.keyAt })).team, box = newBox(), after = store();
  const ok = {
    resumed: !after.handover,
    led: !!teamDoc && teamDoc.lead.public === newKeyDoc.public,
    boxKept: !!oldBox && !!box && box.public === oldBox.public,
    named: !!teamDoc && teamDoc.lead.box === (oldBox && oldBox.public),
    noneBehind: !(after.freshBox && after.freshBox[recA.team]),
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "rslb_k a handover for a new computer resumed after the relay took the move keeps the"
    + " reason it was recorded with: the new key carries the team's box and the team file names it: " + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

/* rslb_f: a handover for a key that may be in other hands, asked through the page's door with its reason: the new key gets a box
   of its own, the reason rides the handover's record, and the team is kept as handed over at its key number with the desks
   admitted then. The Desks screen names nobody before the team's keys change; once they have (the record's key number put below
   the team's, a stand-in for a key change) and no desk is left behind, it says so once and lets the record go. */
LEGS.rslb_f = async () => {
  const w = await leadBoxWorld("rslb-f");
  if (!w) { check(false, "rslb_f setup did not create relay team"); return; }
  const { world, R, thread, recA, oldBox, newKeyDoc, storePath, store, newBox } = w;
  const t = world.transport("shell-lbf");
  let seenReason = "";
  t.answer = async (method, url) => {
    if (method === "POST" && /\/lead$/.test(String(url).split("?")[0])) seenReason = String((store().handover || {}).reason || "");
    return null;
  };
  const shellB = await loadStudioShell(R.ud, { relay: t, env: R.env, thread });
  let res = null, before = null, after = null, again = null, row = null, rowAfter = null;
  try {
    res = await shellB.ask("studio:team-handover", R.proj, "other-hands");
    await until(() => { const r = world.store(recA.rt).get("team"); return r && r.lead && r.lead.pub === newKeyDoc.public; }, 20000);
    row = (store().freshBox || {})[recA.team] || null;
    before = await shellB.ask("studio:desks", R.proj);
    const data = store();
    if (data.freshBox && data.freshBox[recA.team]) data.freshBox[recA.team].epoch = 0;
    fs.writeFileSync(storePath, JSON.stringify(data, null, 1) + "\n");
    after = await shellB.ask("studio:desks", R.proj);
    rowAfter = (store().freshBox || {})[recA.team] || null;
    again = await shellB.ask("studio:desks", R.proj);
  } finally { await shellB.done(); }
  const teamDoc = (await heldTeam(recA.folder, { key: R.keyAt })).team, box = newBox();
  const ok = {
    handed: !!res && !res.error && !!teamDoc && teamDoc.lead.public === newKeyDoc.public,
    reasonRecorded: seenReason === "other-hands",
    boxFresh: !!oldBox && !!box && box.public !== oldBox.public && teamDoc.lead.box === box.public,
    kept: !!row && row.epoch === teamDoc.epoch && Array.isArray(row.desks),
    quietBefore: !!before && !before.error && !before.reinvite,
    noneOnce: !!after && !!after.reinvite && after.reinvite.none === true && !rowAfter && !!again && !again.reinvite,
  };
  check(Object.keys(ok).every((k) => ok[k] === true), "rslb_f a handover for a key in other hands gives the new key a box of its own, records"
    + " its reason with the handover, keeps the team as handed over, and the Desks screen names nobody until the keys change: "
    + Object.keys(ok).map((k) => k + " " + ok[k]).join(", "));
};

/* ---- the plants ------------------------------------------------------------------------------------------------------ */
const PLANTS = [
  { leg: "rts1", file: "src/wire.cjs", mark: "wire-test-relay", line: "const RELAY_TEST = \"https://etiuda.dev/relay-staging/v1/\";" },
  { leg: "rts1", file: "src/relay.mjs", mark: "rts-elsewhere", line: "      if (false) {" },
  { leg: "rsto", file: "src/relay.mjs", mark: "rs-to-passed", line: "    ;" },
  { leg: "rts1", file: "src/relay.mjs", mark: "rts-elsewhere-clear", line: "      ;" },
  { leg: "rts1", file: "src/relay.mjs", mark: "rts-door", line: "      )" },
  { leg: "rts2", file: "src/relay.mjs", mark: "rts-door-exact", line: "  return relayReached(url);" },
  { leg: "rts1", file: "ui/app.js", mark: "rts-elsewhere-words", line: "    if (kind === \"elsewhere\") return \"\";" },
  { leg: "rslb_k", file: "shell/main.js", mark: "lb-resume-reason", line: "        reason: \"\"" },
  { leg: "rslb_f", file: "shell/main.js", mark: "lb-note", line: "" },
  { leg: "rslb_f", file: "shell/main.js", mark: "lb-moved", line: "  if (!row) return facts;" },
  { leg: "rsho_c4", file: "shell/main.js", mark: "handover-fresh-t", line: "            t: ho.t || Date.now()," },
  { leg: "rsho_c5", file: "shell/main.js", mark: "handover-ended", line: "" },
  { leg: "rsho_c3", file: "shell/main.js", mark: "handover-uncertain-hold", line: "" },
  { leg: "rsr1a", file: "src/studio.mjs", mark: "r1-carry", line: "    ;" },
  { leg: "rsk10", file: "shell/main.js", mark: "k10-unspent", line: "      throw R.refuse(\"This Studio keeps another signing key, so the copy was not restored.\");" },
  /* Board 984's guards, each lifted alone. Not planted, and why: the key in the key's place being the handover's new key (no
     way through Studio changes that key while a handover is under way: removing it is refused then, and a key is made only
     where none is); keepOldKeyAside's look again under the team's lock, and its refusal of a file the sign-in cannot open
     again (neither is reachable without a race or a failing keyring the lab does not make). */
  { leg: "b984a", file: "shell/main.js", mark: "984-take", line: "  if (false) {" },
  { leg: "b984b", file: "shell/main.js", mark: "984-old-pub", line: "  ;" },
  { leg: "b984e", file: "shell/main.js", mark: "984-recorded-opens", line: "  ;" },
  { leg: "b984d", file: "shell/main.js", mark: "984-cap", line: "      const cap = null;" },
  { leg: "b984d", file: "shell/main.js", mark: "984-restored", line: "    const handover = Object.assign({}, cur.handover, { oldKeyFile: asidePath });" },
  { leg: "b984c", file: "shell/main.js", mark: "k10-unspent", line: "      ;" },
  { leg: "b984f", file: "shell/main.js", mark: "984-wanted", line: "  const wanted = false;" },
  /* The test architect's plant on d37ed4b2: oldKeyWanted for any handover, which b984e's state, its old key still opening, refuses. */
  { leg: "b984e", file: "shell/main.js", mark: "984-wanted", line: "  const wanted = !!readStore().handover;" },
  { leg: "b984f", file: "ui/app.js", mark: "984-row-restore", line: "      + \"\"" },
  /* The same mark with the kept-by-the-system test lifted: a passphrase key would show the restore twice. */
  { leg: "b984f", file: "ui/app.js", mark: "984-row-restore", line: "      + (sign.oldKeyWanted ? '<button class=\"btn sm\" data-act=\"key-restore\">' + I(\"restore\") + esc(T(\"Restore a backup…\")) + \"</button> \" : \"\")" },
  { leg: "rsr1a", file: "src/publish.mjs", mark: "r1-seal", line: "  writeWhole(ecAt, bytes);" },
  { leg: "rsr1a", file: "src/publish.mjs", mark: "r1-ring", line: "  const ring = { file: ringPath(folder) };" },
  { leg: "rsr1c", file: "src/publish.mjs", mark: "r1-signer", line: "  ;" },
  { leg: "rsr1d", file: "src/studio.mjs", mark: "r1-take-ec", line: "    ;" },
  { leg: "rsr1d", file: "src/studio.mjs", mark: "r1-take-ring", line: "    ;" },
  { leg: "rsr1e", file: "src/studio.mjs", mark: "r1-take-name", line: "      name = fixedName(home, p.project, String(p.draft.id || \"\"));" },
  { leg: "rsr1f", file: "src/publish.mjs", mark: "r1-signer", line: "  if (!read || !catalog.sig || catalog.sig.keyId !== read.keyId) return null;" },
  { leg: "rsce1", file: "src/publish.mjs", mark: "ce-taken", line: "  ;" },
  /* Grok's review 29, finding 2: the carry leaves a newer edition of the catalog in the place */
  { leg: "rsce2", file: "src/publish.mjs", mark: "r2-carry-newer", line: "  ;" },
  { leg: "rsce3", file: "src/studio.mjs", mark: "ce-take-holds", line: "    const ours = true;" },
  { leg: "rs926a", file: "shell/main.js", mark: "rs926-keep", line: "    const mirror = path.join(path.dirname(at), \"relay\", rt);" },
  { leg: "rs926a", file: "src/studio.mjs", mark: "rs926-channel", line: "  ;" },
  { leg: "rs926a", file: "src/studio.mjs", mark: "rs926-place", line: "    writeProject(home, Object.assign({}, found.project, { draft: found.draftName, sealedTeam: written.id }));" },
  /* rs926k, not rs926b: since finding 9 a team kept for the folder is refused first (rs926-kept), so rs926b's second press is
     refused twice over; rs926k's project has a team file of its own and no kept team, so this throw is its only guard. */
  { leg: "rs926k", file: "shell/main.js", mark: "rs926-first", line: "    ;" },
  { leg: "rs926i", file: "shell/main.js", mark: "rs926-mark", line: "    || false" },
  { leg: "rs926j", file: "shell/main.js", mark: "rs926-kept", line: "    || false" },
  { leg: "rs926k", file: "shell/main.js", mark: "rs926-file", line: "    || false;" },
  { leg: "rs926b", file: "shell/main.js", mark: "rs926-forget", line: "    ;" },
  { leg: "rs926f", file: "shell/main.js", mark: "rs926-unwind", line: "    ;" },
  { leg: "rs926g", file: "shell/main.js", mark: "rs926-unwind", line: "    ;" },
  { leg: "rs926h", file: "shell/main.js", mark: "rs926-together", line: "    K.forgetTeam(at, teamId);" },
  { leg: "rs926f", file: "src/studio.mjs", mark: "rs926-restore", line: "    ;" },
  { leg: "rs926f", file: "src/studio.mjs", mark: "rs926-unmark", line: "    ;" },
  { leg: "rs926g", file: "src/studio.mjs", mark: "rs926-unlink", line: "  ;" },
  { leg: "rs926b", file: "src/studio.mjs", mark: "rs926-undo", line: "    ;" },
  { leg: "rs926c", file: "shell/main.js", mark: "rs926-key", line: "  ;" },
  { leg: "rs962s6g", file: "src/relay.mjs", mark: "rs-head-gone", line: "      ;" },
  { leg: "rs926e", file: "shell/main.js", mark: "g3-handler", line: "  const no = null;" },
  { leg: "rs935d", file: "shell/main.js", mark: "g3-handler", line: "  const no = null;" },
  { leg: "rs935c", file: "src/relay.mjs", mark: "g3-judge", line: "  const no = null;" },
  { leg: "rs935b", file: "src/relay.mjs", mark: "g3-create2", line: "    sig: signHex(o.open, C.createBytes(o.rt, o.open.keyId, o.t)) });" },
  { leg: "rs935a", file: "src/relay.mjs", mark: "g3-ok", line: "  if (true) return null;" },
  { leg: "rs935e", file: "shell/main.js", mark: "g3-roots", line: "    relayRunner = (await relayLib()).relayRunner({ teamsFile: at, vault, keyFile: keyAt, secret: relaySecret," },
  { leg: "rs935f", file: "ui/lang.js", mark: "g3-pl", line: "" },
  { leg: "rs962y", file: "src/relay.mjs", mark: "rs-team-act", line: "  const teamWrite = (team, fn) => fn();" },
  { leg: "rs962y", file: "src/relay.mjs", mark: "rs-keep-file", line: "    try { const k = null; }" },
  { leg: "rs962z", file: "src/relay.mjs", mark: "rs-stale-again", line: "      } catch (e) { throw e; }" },
  { leg: "rs935n", file: "src/relay.mjs", mark: "n1-case", line: "    const said = GRANT_SAID.none;" },
  { leg: "rs926d", file: "ui/app.js", mark: "rs926-shape", line: "  const RELAY_MIRROR = /^$/;" },
  { leg: "rs926d", file: "ui/app.js", mark: "rs926-route", line: "      if (false) return teamOnRelay(dir);" },
  { leg: "rs1", file: "src/team-store.mjs", mark: "rs-mirror", line: "" },
  { leg: "rs2", file: "src/relay.mjs", mark: "rs-space", line: "      const r = { ok: true };" },
  { leg: "rs3", file: "src/relay.mjs", mark: "rs-floors", line: "  return C.createChannel({ rt: o.rt, url: o.url, mirror: o.mirror, stateFile: null, write: writeWhole," },
  { leg: "rs4", file: "src/relay.mjs", mark: "rs-enrol", line: "      const r = { ok: true };" },
  { leg: "rs5", file: "src/relay.mjs", mark: "rs-head", line: "" },
  { leg: "rs5", file: "src/relay.mjs", mark: "rs5-first", line: "    if (!prev)" },
  { leg: "rsm9a", file: "src/relay.mjs", mark: "m9-lead-signed", line: "    ;" },
  { leg: "rsm9a", file: "src/relay.mjs", mark: "m9-blind", line: "    if (!cat || typeof cat.id !== \"string\" || !cat.id) { unread(name); continue; }" },
  { leg: "rsm9a", file: "src/relay.mjs", mark: "m9-keep-named", line: "      ;" },
  { leg: "rsm9a", file: "src/relay.mjs", mark: "m9-named-signed", line: "  ;" },
  { leg: "rsm9b", file: "src/studio.mjs", mark: "m9-handover-own", line: "      ;" },
  { leg: "rs6", file: "src/relay.mjs", mark: "rs-wrap-read", line: "      const read = i.state === \"spent\";" },
  { leg: "rs6", file: "src/relay.mjs", mark: "rs-copies", line: "      inviteKeys: () => []," },
  { leg: "rs6", file: "src/relay.mjs", mark: "rs-register", line: "      const r = { ok: true };" },
  { leg: "rs6", file: "src/invite.mjs", mark: "rs-invite-relay", line: "  const doc = { team: String(t.team || \"\"), folder: String(t.folder || \"\") };" },
  { leg: "rs7", file: "src/relay.mjs", mark: "rs-agree", line: "      agree: (peer) => agreeFrom({ secretKey: crypto.generateKeyPairSync(\"x25519\").privateKey })(peer)," },
  { leg: "rs12", file: "src/relay.mjs", mark: "rs-watch", line: "    request: o.request, connect: o.connect, say: o.say, onTeam: o.onTeam, clock: o.clock, watch: false, pollMs: o.pollMs });" },
  { leg: "rs11", file: "src/studio.mjs", mark: "rs-remove-gone", line: "        ;" },
  { leg: "rs11", file: "src/relay.mjs", mark: "rs-off-roster", line: "      const off = false;" },
  { leg: "rs11", file: "src/relay.mjs", mark: "dfx-let-go", line: "" },
  { leg: "rs11", file: "src/team-store.mjs", mark: "rs-spent-ends", line: "      state: live && !(Date.parse(String(r.expires || \"\")) > when) ? \"expired\" : String(r.state || \"\")," },
  { leg: "rs9k", file: "src/relay.mjs", mark: "rs9-keys", line: "      Store.markRelay(d.teamsFile, t.team, { headAt: call.t, headStamp: stamp + \"|\" + x.open.privateKey.export({ type: \"pkcs8\", format: \"der\" }).toString(\"base64\") });" },
  { leg: "rs9k", file: "src/relay.mjs", mark: "rs9-sent", line: "  const body = { keys, rev, t: o.t, sig: signHex(o.open, C.devicesBytes(o.rt, rev, o.t, keys, f)), pkcs8: o.open.privateKey.export({ type: \"pkcs8\", format: \"der\" }).toString(\"base64\") };" },
  { leg: "rs8", file: "src/removed.mjs", mark: "f2-snapshot", line: "      const was = false;" },
  { leg: "rs8", file: "src/removed.mjs", mark: "f2-counter", line: "      const before = false;" },
  { leg: "rs8", file: "src/stats.mjs", mark: "f2-stats-after", line: "" },
  { leg: "rs8", file: "src/stats.mjs", mark: "f2-stats-mark", line: "" },
  { leg: "rs8q", file: "src/studio.mjs", mark: "f2-queue-after", line: "" },
  { leg: "rs8r", file: "src/relay.mjs", mark: "s2-said", line: "      request: d.request, connect: d.connect, say: (l) => say(\"relay of team \" + t.team + \": \" + String(l).replace(\"left out\", \"kept\").replace(\"no longer on the team\", \"still on the team\")), clock, watch: d.watch, pollMs: d.pollMs });" },
  { leg: "rs8r", file: "src/studio.mjs", mark: "rs-left", line: "  const removedLeft = [].filter((l) => l.path === \"desks/\" + l.desk + \"/stats.estat\" && roster.indexOf(l.desk) < 0)" },
  { leg: "rs8s", file: "ui/app.js", mark: "f2-left-said", line: "    const leftOut = [].map((r) => \"<div><div>\"" },
  { leg: "rs8s", file: "ui/app.js", mark: "f2-stats-words", line: "      + r.cells.map((c, i) => '<td class=\"mono\">' + esc(c) + (false" },
  { leg: "rs8q", file: "src/studio.mjs", mark: "f2-queue-mark", line: "" },
  { leg: "rs2u", file: "src/catalog-use.mjs", mark: "s2-use", line: "    const inner = null;" },
  { leg: "rs2a", file: "src/catalog-use.mjs", mark: "s2-answer", line: "    if (true) { return; }" },
  { leg: "rs2t", file: "src/studio.mjs", mark: "s2-roster-key", line: "      return text;" },
  { leg: "rs2e", file: "src/studio.mjs", mark: "s2-edit", line: "    desks = [];" },
  /* Since stage 0b deskKeyOf gives a removed desk's key only for a copy the removal record holds (owed), so answerRefusal
     refuses such an answer before s2-owe's line, which alone is never reached: it is lifted with s0b-st-owed-key. Since F4b
     (2ca1f8ff, 2026-11-08) the retired key number's refusal (s0b-st-epoch) also stands in front for a copy not owed, so it is
     lifted too; the two guards lifted without s2-owe leave rs2d green (the test architect, 2026-11-12). */
  { leg: "rs2d", file: "src/catalog-use.mjs", mark: "s2-owe", line: "      if (false) return;",
    with: [{ mark: "s0b-st-owed-key", line: "  return ownKey(o.removed, deskId) && o.removed[deskId] ? String(o.removed[deskId].key || \"\") : \"\";" },
      { mark: "s0b-st-epoch", line: "  ;" }] },
  { leg: "rs2d", file: "src/relay.mjs", mark: "s2-said", line: "      request: d.request, connect: d.connect, say: (l) => say(\"relay of team \" + t.team + \": \" + String(l).replace(\"left out\", \"kept\").replace(\"no longer on the team\", \"still on the team\")), clock, watch: d.watch, pollMs: d.pollMs });" },
  { leg: "rs911", file: "src/relay.mjs", mark: "rs-catch-before", line: "  ;" },
  { leg: "rs911", file: "src/relay.mjs", mark: "rs-catch-held", line: "  const ran = ch.online();" },
  { leg: "rs911", file: "src/relay.mjs", mark: "rs-catch-offline", line: "  return { ok: false, offline: true, said: \"\", saidPl: \"\" };" },
  { leg: "rs911", file: "src/relay.mjs", mark: "rs-catch-closed", line: "    ;" },
  { leg: "rs911", file: "src/relay.mjs", mark: "rs-catch-idle", line: "  ;" },
  { leg: "rs911", file: "shell/main.js", mark: "rs-catch-shell", line: "    const up = { ok: true, offline: false };" },
  { leg: "rs911", file: "ui/app.js", mark: "rs-catch-said", line: "      if (false) S.dkNote.push(T(r.catchUpSaid));" },
  { leg: "rs2l", file: "shell/main.js", mark: "rs-land-removed", line: "" },
  { leg: "rs911h", file: "shell/main.js", mark: "rs-catch-hand", line: "  ;" },
  { leg: "rs914a", file: "src/relay.mjs", mark: "rs914-open", line: "      inviteKeys: () => sealRows(t.team).map((i) => ({ id: i.inv, key: i.seal }))," },
  { leg: "rs914a", file: "src/relay.mjs", mark: "e4s-bound", line: "          if (false) {" },
  { leg: "rse4a", file: "src/relay.mjs", mark: "e4s-open", line: "    .filter((i) => i.state === \"live\" || (i.state === \"spent\" && copies)" },
  { leg: "rse4b", file: "src/relay.mjs", mark: "e4s-withdrawn", line: "        const off = null;" },
  { leg: "rse4c", file: "src/relay.mjs", mark: "e4s-revive", line: "      ;" },
  { leg: "rse4c", file: "src/team-store.mjs", mark: "e4s-keep-secret", line: "  keep = false;" },
  { leg: "rse4d", file: "src/relay.mjs", mark: "e4s-bound", line: "          if (false) {" },
  { leg: "rse4e", file: "src/relay.mjs", mark: "e4s-taken", line: "      if (e && e.desk) off.push(e.desk.id);" },
  { leg: "rse4i", file: "src/relay.mjs", mark: "e4s-taken", line: "      if (e && e.desk && held.metas.has(e.desk.id)) off.push(e.desk.id);" },
  { leg: "rse4i", file: "src/relay.mjs", mark: "e4s-signed", line: "      if (!r || !r.ok) return true;" },
  { leg: "rse4i", file: "src/relay.mjs", mark: "e4s-proof", line: "      return true;" },
  { leg: "rse4j", file: "src/relay.mjs", mark: "rp-supersedes", line: "    ;" },
  { leg: "rse4j", file: "src/relay.mjs", mark: "rp-asked", line: "            ;" },
  { leg: "rse4k", file: "src/team-store.mjs", mark: "rp-forward", line: "  ;" },
  { leg: "rse4g", file: "src/relay.mjs", mark: "e4s-evidence", line: "        ;" },
  { leg: "rse4h", file: "src/relay.mjs", mark: "e4s-evidence", line: "        ;" },
  { leg: "rse4h", file: "src/relay.mjs", mark: "e4s-expired", line: "      || false)" },
  { leg: "rse4f", file: "ui/app.js", mark: "e4s-row", line: "      ;" },
  { leg: "rse4f", file: "shell/main.js", mark: "e4s-shell-reopened", line: "    ;" },
  { leg: "rse4f", file: "src/team-store.mjs", mark: "e4s-reopened", line: "  ;" },
  { leg: "rs914b", file: "src/join.mjs", mark: "rs914-admit", line: "    const doorRefused = false;" },
  { leg: "rs914c", file: "src/relay.mjs", mark: "rs914-retry", line: "      if (false) return r;" },
  { leg: "rs987", file: "src/relay.mjs", mark: "rs987-drops-alone", line: "    ;" },
  { leg: "rs974lt", file: "src/relay.mjs", mark: "rs-enrol", line: "      const r = { ok: true };" },
  { leg: "rs974lt", file: "engine/pinned/relay/core.cjs", mark: "lapse-withdraw", line: "    removing = false;", comment: "proves the leg reads the pinned relay's lapse exception: only offAtRelay turns" },
  { leg: "s3wrap", file: "src/relay.mjs", mark: "s3-add-wrap", line: "      .map((i) => ({ id: i.inv, hash: sha256(Buffer.from(i.token, \"utf8\")) }));" },
  { leg: "s3wrap", file: "src/relay.mjs", mark: "s3-wraps-bytes", line: "  return C.invitesBytes(rt, t, add, drop);" },
  /* s3-wrap-cap went with the lab's invites stand-in (934 (4b)): the cap on a wrap is the pinned relay's own, relay/core.cjs plant:S3-wrap-cap, guarded by the engine's relay-unit. */
  { leg: "s3until", file: "src/relay.mjs", mark: "s3-until", line: "  if (false) row.until = 0;" },
  { leg: "s3move", file: "src/relay.mjs", mark: "s3-reseal", line: "    const wraps = [];" },
  { leg: "s3move", file: "src/relay.mjs", mark: "s3-forget", line: "        if (false) Store.forgetInviteSecret(d.teamsFile, t.team, i.id);" },
  { leg: "s3name", file: "src/team-store.mjs", mark: "s3-person", line: "  if (false) list[String(i.id)].person = \"\";" },
  { leg: "s3name", file: "src/relay.mjs", mark: "s3-states", line: "        const heard = null;" },
  { leg: "rs934a", file: "src/relay.mjs", mark: "rs934-states", line: "  const r = await post(o.request, base(o.url) + \"/t/\" + o.rt + \"/invite-states\", {}, { authorization: \"Bearer \" + session });" },
  { leg: "s3row", file: "ui/app.js", mark: "s3-row", line: "      const heard = T(\"check code, valid until {WHEN}\", { WHEN: untilOf(i.expires) });" },
  { leg: "s3cancel", file: "src/relay.mjs", mark: "s3-cancel", line: "  const wasUsed = false;" },
  { leg: "s3link", file: "src/invite.mjs", mark: "s3-link", line: "  const link = \"\";" },
  { leg: "s3copies", file: "src/invite.mjs", mark: "s3-clip", line: "  return made.blob;" },
  { leg: "s3copies", file: "shell/main.js", mark: "s3-form", line: "  const copyAs = \"link\";" },
  { leg: "s3copyui", file: "ui/app.js", mark: "s3-copy-text", line: "        + \"\"" },
  { leg: "s3copyui", file: "ui/app.js", mark: "s3-copy-note", line: "      : T(\"The invitation is on the clipboard again.\")];" },
  { leg: "s3copyui", file: "ui/lang.js", mark: "s3-pl-note", line: "    \"The invitation is on the clipboard as text, to be pasted in Etiuda.\": \"The invitation is on the clipboard as text, to be pasted in Etiuda.\"," },
  { leg: "s3shell", file: "shell/main.js", mark: "s3c-known", line: "    decision = await Relay.cancelInvitation({ id: rec.inv, confirm: true, pending: pending, knownUsed: knownUsed });" },
  { leg: "s3shellused", file: "shell/main.js", mark: "s3c-known", line: "    decision = await Relay.cancelInvitation({ id: rec.inv, confirm: true, pending: pending, knownUsed: knownUsed });" },
  { leg: "s3shellused", file: "shell/main.js", mark: "s3c-used", line: "      id: rec.inv, confirm: true });" },
  { leg: "s3shell", file: "shell/main.js", mark: "s3c-note", line: "" },
  { leg: "s3shellused", file: "shell/main.js", mark: "s3c-note", line: "" },
  { leg: "s3shellused", file: "shell/main.js", mark: "s3c-pending", line: "" },
  { leg: "s3first", file: "shell/main.js", mark: "s3c-note", line: "" },
  /* The moved-line plant (the note put back after the catch-up) is retired, 2026-11-12, the test architect: since the team lock
     (board 962 stage 5) the move runs in its team's act, and in this leg no watch admits before that act ends, so the note
     moved before the ask, before the key's keeping, or with plant team-act lifted as well, leaves s3first green; only the
     note removed (the line above) turns it red. Nothing planted there is a fault this tree can have. */
  { leg: "s3shell", file: "src/relay.mjs", mark: "s3c-end", line: "" },
  { leg: "s3shellused", file: "shell/main.js", mark: "s3c-kept", line: "" },
  { leg: "s922r", file: "shell/main.js", mark: "s922-shell-refused", line: "  const told = { said: \"\", move: \"\" };" },
  { leg: "s922a", file: "shell/main.js", mark: "s922-shell-joined", line: "            ;" },
  { leg: "rsA4", file: "src/relay.mjs", mark: "a4-me-box",
    line: "    me: () => { const k = o.open(); return k ? { keyId: k.keyId, public: k.public, privateKey: k.privateKey, place: \"root\" } : null; }," },
  { leg: "rsA4door", file: "src/relay.mjs", mark: "a4-door-never", line: "    ;" },
  { leg: "rsA4door", file: "src/relay.mjs", mark: "a4-door-post", line: "    const r = { ok: true };" },
  { leg: "rsDoorSvc", file: "src/relay.mjs", mark: "sd-key-id", line: "    if (!x || !x.box || x.open.keyId === keyIdFor(x.open.public)) return;" },
  { leg: "rsDoorSvc", file: "src/relay.mjs", mark: "sd-open", line: "      && t.door.startsWith(mine)" },
  { leg: "rsDoorSvc", file: "src/relay.mjs", mark: "sd-once", line: "    ;" },
  { leg: "rsDoorSvc", file: "src/relay.mjs", mark: "sd-never", line: "    ;" },
  { leg: "rsDoorSvc", file: "src/relay.mjs", mark: "sd-taken", line: "    serviceDoorsTaken = now;" },
  { leg: "rsm9c", file: "src/relay.mjs", mark: "m9-doors-held", line: "    const ranked = eligible;" },
  { leg: "rsm9c", file: "src/relay.mjs", mark: "m9-doors-said", line: "      ;" },
  { leg: "rsA4", file: "src/relay.mjs", mark: "a4-door-drop", line: "    const r = { ok: true };" },
  { leg: "rsA4", file: "src/relay.mjs", mark: "a4-door-joined", line: "    const r = { ok: true };" },
  { leg: "rsA4shell", file: "shell/main.js", mark: "a4-shell-door", line: "      doorRefs: () => []," },
  { leg: "rsA4shell", file: "shell/main.js", mark: "a4-shell-drop", line: "            ;" },
  { leg: "s922said", file: "ui/app.js", mark: "s922-said", line: "      S.desks = r; S.err = null; S.dkNote = null; paint();" },
  { leg: "s922r", file: "src/relay.mjs", mark: "s922-owed", line: "  ;" },
  { leg: "s922r", file: "src/relay.mjs", mark: "s922-owed-sync", line: "      if (false)" },
  { leg: "s922r", file: "src/relay.mjs", mark: "s922-replay",
    line: "      if (r && r.ok === true) Store.markRelayInvite(d.teamsFile, t.team, i.id, { answerOwed: null, dropAfter: clock() + ANSWER_HOLD_MS });" },
  { leg: "s922floor", file: "src/relay.mjs", mark: "s922-floor",
    line: "      if (r && (r.ok === true || r.reason === \"replay-counter\")) Store.markRelayInvite(d.teamsFile, t.team, i.id, { answerOwed: null, dropAfter: clock() + ANSWER_HOLD_MS });" },
  { leg: "s922move", file: "src/relay.mjs", mark: "s922-used", line: "  const used = false;" },
  { leg: "s922move", file: "src/relay.mjs", mark: "s922-used", line: "  const used = true;" },
  { leg: "s922move", file: "src/relay.mjs", mark: "s922-fresh", line: "  ;" },
  { leg: "s922move", file: "src/relay.mjs", mark: "s922-move", line: "  ;" },
  { leg: "s922move", file: "shell/main.js", mark: "s922-shell-move", line: "  ;" },
  { leg: "s922cover", file: "ui/app.js", mark: "s922-cover", line: "      ;" },
  { leg: "r2pub", file: "shell/main.js", mark: "r2-publish-sync", line: "      ;" },
  { leg: "r2pub", file: "shell/main.js", mark: "r2-sync-failed", line: "          ;" },
  { leg: "rpm1", file: "shell/main.js", mark: "pm1-catch-up", line: "      const caught = Promise.resolve();" },
  { leg: "r2pub", file: "shell/main.js", mark: "pm1-bound", line: "      await caught.catch(() => {});" },
  { leg: "r2pub", file: "shell/main.js", mark: "pm1-late-pending", line: "      caughtLate = false;" },
  { leg: "rs10t", file: "src/wire.cjs", mark: "wire-idle", line: "      ;" },
  { leg: "rs920", file: "src/relay.mjs", mark: "rs920-seal", line: "      sealEpoch: () => { const es = Object.keys(keysOf(t.team)).map(Number).filter((n) => Number.isSafeInteger(n) && n >= 1); return es.length ? Math.max(...es) : null; }," },
  { leg: "rs920", file: "src/publish.mjs", mark: "rs920-pending", line: "  const newer = newestEpochHeld(o.teamKeys, held.team.id);" },
  { leg: "rs920", file: "shell/main.js", mark: "rs920-mark", line: "" },
  { leg: "rs920", file: "shell/main.js", mark: "rs920-clear", line: "" },
  { leg: "rs920b", file: "src/relay.mjs", mark: "rs920-stale", line: "" },
  { leg: "rs923c5", file: "src/team-store.mjs", mark: "rs923-c5", line: "    const replace = false;" },  { leg: "g2s1", file: "src/relay.mjs", mark: "g2s-post", line: "      const r = { ok: false, said: \"planted\" };" },
  { leg: "g2s2", file: "src/relay.mjs", mark: "g2s-route", line: "  const r = await post(o.request, base(o.url) + \"/t/\" + o.rt + \"/renew\", { grant: o.grant });" },
  { leg: "g2s3", file: "src/relay.mjs", mark: "g2s-taken", line: "        ;" },
  { leg: "g2s3", file: "src/relay.mjs", mark: "g2s-told", line: "  return false;" },
  { leg: "g2s3", file: "src/relay.mjs", mark: "g2s-unknown", line: "  if (!g) return !!l && Number.isSafeInteger(l.until) && l.until < grant.until;" },
  { leg: "g2s4", file: "src/relay.mjs", mark: "g2s-refused", line: "        ;" },
  { leg: "g2s4", file: "src/relay.mjs", mark: "g2s-ok", line: "      if (true) {" },
  { leg: "g2s8", file: "src/relay.mjs", mark: "g2s-heard", line: "" },
  { leg: "g2s5", file: "shell/main.js", mark: "g2s-once", line: "    due.push(row);" },
  { leg: "g2s5", file: "shell/main.js", mark: "g2s-nudge", line: "    ;" },
  { leg: "g2s5", file: "shell/main.js", mark: "g2s-desks", line: "  return facts;" },
  { leg: "g2s5", file: "src/relay.mjs", mark: "g2s-step", line: "    state = l.state;" },
  { leg: "g2s6", file: "ui/app.js", mark: "g2s-page-cover", line: "      + \"\"" },
  { leg: "g2s6", file: "ui/app.js", mark: "g2s-page-desks", line: "            + \"\"" },
  { leg: "g2s6", file: "ui/app.js", mark: "g2s-page-due", line: "    S.lapseDue = [];" },
  { leg: "g2s5", file: "shell/main.js", mark: "g2s-seen", line: "    ;" },
  { leg: "g2s9", file: "ui/app.js", mark: "g2s-page-seen", line: "    ;" },
  { leg: "g2s10", file: "src/relay.mjs", mark: "g2s-lead-hold", line: "  ;" },
  { leg: "g2s10", file: "src/relay.mjs", mark: "g2s-lead-mark", line: "        ;" },
  { leg: "g2s10", file: "src/relay.mjs", mark: "g2s-refused", line: "        say(\"relay of team \" + t.team + \": \" + r.said);" },
  { leg: "g2s11", file: "ui/app.js", mark: "g2s-key-said",
    line: "      + (n.keyChanged ? '<div class=\"kv\" data-key-changed><span class=\"n\">' + esc(T(\"This Studio's signing key has changed since its licence was issued. Activate it again below to bring the licence and the relay to the new key.\")) + \"</span></div>\" : \"\")" },
  { leg: "g2s6", file: "ui/app.js", mark: "g2s-page-swept", line: "    const swept = T(\"On {SWEPT} the relay deletes the team's copy.\", v);" },
  { leg: "g2s7", file: "src/relay.mjs", mark: "g2s-inside", line: "  ;" },
  { leg: "g2s12", file: "src/relay.mjs", mark: "rr-cover", line: "    } else if (owesGrant(t, grant)) {" },
  { leg: "g2s13", file: "src/relay.mjs", mark: "rr-swept", line: "      } else if (false) {" },
  { leg: "g2s14", file: "engine/pinned/shell/relay/channel.cjs", mark: "remade-seen", line: "" },
  { leg: "g2s15", file: "engine/pinned/relay/core.cjs", mark: "key-enrolled", line: "      return issue(b.challenge, { key: b.key, inv: null });" },
  { leg: "g2s16", file: "src/relay.mjs", mark: "rr-remake", line: "    const r = { ok: false, said: \"planted\" };" },
  { leg: "g2s17", file: "engine/pinned/shell/relay/channel.cjs", mark: "remade-seq", line: "      st.seq = 0; for (const f of io.list()) io.remove(f);" },
  { leg: "g2s18", file: "ui/app.js", mark: "rr-page-back", line: "      \"\");" },
  { leg: "g2s19", file: "src/relay.mjs", mark: "rr-early", line: "    ;" },
  { leg: "g2s20", file: "engine/pinned/relay/core.cjs", mark: "relay:swept-other", line: "    ;", comment: "proves the lab relay, not Studio" },
  { leg: "g2s20", file: "engine/pinned/relay/core.cjs", mark: "relay:swept-mark", line: "      ;", comment: "proves the lab relay, not Studio" },
  { leg: "g2s21", file: "ui/app.js", mark: "rr-page-taken", line: "    if (x.step === \"taken\") return \"\";" },
  { leg: "g2s22", file: "shell/main.js", mark: "rr-shell-taken", line: "    ;" },
  { leg: "g2s23", file: "src/relay.mjs", mark: "rr-taken-reasons", line: "  const placeTaken = (r) => !!r && r.reason !== \"grant\" && !/^status-/.test(String(r.reason)) && [\"bad-grant\", \"nonce-stale\", \"rate\", \"fault\"].indexOf(r.reason) < 0;" },
  { leg: "g2s24", file: "src/relay.mjs", mark: "rr-taken", line: "    ;" },
  { leg: "g2s24", file: "src/relay.mjs", mark: "rr-ask", line: "    asking = false;" },
  { leg: "g2s25", file: "src/relay.mjs", mark: "rr-swept-other", line: "const TAKEN_REASONS = [\"not-enrolled\"];" },
  { leg: "g2s26", file: "src/relay.mjs", mark: "rr-revoked-fetch", line: "      ;" },
  { leg: "g2s26", file: "src/licence-client.mjs", mark: "rr-grant-replaces", line: "    const later = !was || a.grant.until > was.until || (a.grant.until === was.until && a.grant.paid && !was.paid);" },
  { leg: "g2s26", file: "ui/app.js", mark: "rr-page-revoked", line: "    if (x.step === \"revoked\") return \"\";" },
  { leg: "g2s26", file: "shell/main.js", mark: "rr-shell-revoked", line: "    ;" },
  { leg: "g2s27", file: "src/relay.mjs", mark: "rr-avoid-held", line: "    const avoided = row.grantKey || grantKeyOf(held);" },
  { leg: "g2s28", file: "src/relay.mjs", mark: "rr-clear-hello", line: "    } else if (false) acceptRevoked(path);" },
  { leg: "g2s29", file: "src/relay.mjs", mark: "rr-hide-403", line: "    if (text.indexOf(\"The relay answered 403\") >= 0 || text.indexOf(\"signed by a revoked key\") >= 0) return;" },
  { leg: "g2s30", file: "src/relay.mjs", mark: "rr-say-fetching", line: "      say(\"relay of team \" + team + \": \" + REVOKED_NONE);" },
  { leg: "g2s31", file: "src/relay.mjs", mark: "rr-none", line: "    ;" },
  { leg: "g2s31", file: "ui/app.js", mark: "rr-page-none", line: "    if (x.step === \"revoked-none\") return \"\";" },
  { leg: "g2s32", file: "shell/main.js", mark: "rr-check-fetch", line: "  ;" },
  { leg: "g2s33", file: "src/relay.mjs", mark: "rr-first-taken", line: "        return r;" },
  { leg: "g2s33", file: "ui/app.js", mark: "rr-page-first", line: "    ;" },
  { leg: "g2s34", file: "src/relay.mjs", mark: "rr-taken", line: "    ;" },
  { leg: "g2s34", file: "src/relay.mjs", mark: "rr-probe", line: "          const p = { ok: false, reason: \"status-0\" };" },
  { leg: "g2s36", file: "src/relay.mjs", mark: "rr-first-none", line: "    noneLeft(team);" },
  { leg: "g2s37", file: "src/relay.mjs", mark: "rr-retry-fetch", line: "    const dueFetch = asking || !lastFetched.has(fetchedKey);" },
  { leg: "g2s38", file: "src/relay.mjs", mark: "rr-hour-expired", line: "    const expired = false;" },
  { leg: "g2s39", file: "src/relay.mjs", mark: "rr-ask-none", line: "    if (expired) noneLeft(team);" },
  { leg: "h2a", file: "shell/main.js", mark: "h2-folder", line: "    if (p.folder !== mirror) {" },
  { leg: "h2a", file: "src/team-store.mjs", mark: "h2-mirror", line: "  return stored;" },
  { leg: "h2e", file: "src/studio.mjs", mark: "h2-publish", line: "  const folder = opts.folder ? String(opts.folder) : p.project.folder;" },
  { leg: "h2b", file: "ui/app.js", mark: "h2-licence", line: "      ? T(\"The team comes back with the signing key's backup copy. There is nothing else to keep.\")" },
  { leg: "h2b", file: "shell/main.js", mark: "h2-grant", line: "  const withLicence = Object.assign({}, facts || {}, { relayLicence: \"holds\" });" },
  { leg: "h2d", file: "shell/main.js", mark: "h2-keymade", line: "  ;" },
  { leg: "h2f", file: "src/relay.mjs", mark: "n1-unread", line: "        ;" },
  { leg: "h2g", file: "src/relay.mjs", mark: "sc-asked", line: "    const asked = Store.askedOf(d.teamsFile, t.team, id);" },
  { leg: "h2h", file: "src/relay.mjs", mark: "sc-revive", line: "        ;" },
  { leg: "g2s40", file: "src/relay.mjs", mark: "rr-slow-hourly", line: "    const retryEvery = REVOKED_RETRY_MS;" },
  { leg: "g2s41", file: "src/relay.mjs", mark: "rr-restart-none", line: "    if (false) {" },
  { leg: "g2s42", file: "src/relay.mjs", mark: "rr-clear-tracking", line: "    ;" },
  { leg: "g2s43", file: "src/relay.mjs", mark: "rr-retry-call", line: "      if (false) {" },
  { leg: "g2s44", file: "src/relay.mjs", mark: "g3-revoked-list", line: "  if (false && signer) return { ok: false };" },
  { leg: "g2s45", file: "shell/main.js", mark: "s3c-runner-call", line: "    const request = wire.relayRequest;" },
  { leg: "g2s46", file: "src/relay.mjs", mark: "pg-probe-keep", line: "            Store.markRelay(d.teamsFile, t.team, { granted: grant, refusedLead: \"\", taken: false, grantKey: grantKeyOf(grant), revoked: false, revokedNone: false });" },
  { leg: "h2i", file: "src/relay.mjs", mark: "sc-asked", line: "    const asked = Store.askedOf(d.teamsFile, t.team, id);" },
  { leg: "h2j", file: "src/relay.mjs", mark: "n1-unread-restored", line: "        const restored = false;" },
  { leg: "s932e1", file: "src/studio.mjs", mark: "s932-seal", line: "  if (false) copy.relays = sealRelayRows(pair, relays);" },
  { leg: "s932e1", file: "shell/main.js", mark: "s932-url", line: "    const url = String(r.url || \"\");" },
  { leg: "s932e2", file: "shell/main.js", mark: "s932-keep", line: "      if (false) continue;" },
  { leg: "s932key", file: "shell/main.js", mark: "s932-restore", line: "  if (false) await relaysBack(pair.relays);" },
  { leg: "s932key", file: "shell/main.js", mark: "s932-sync", line: "  ;" },
  { leg: "h2b", file: "ui/app.js", mark: "s932-lost", line: "      : T(\"The team comes back with the signing key's backup copy. There is nothing else to keep.\");" },
  { leg: "rs932", file: "src/relay.mjs", mark: "rs932-note", line: "" },
  { leg: "rs932", file: "src/relay.mjs", mark: "rs932-streak", line: "" },
  { leg: "rs932", file: "ui/app.js", mark: "rs932-page", line: "            + \"\"" },
  { leg: "rs932", file: "shell/main.js", mark: "rs932-desks", line: "" },
  { leg: "rs932c", file: "src/relay.mjs", mark: "rs932-count", line: "" },
  { leg: "rs932c", file: "shell/main.js", mark: "rs932-count-said", line: "" },
  { leg: "rs932c", file: "shell/main.js", mark: "rs932-count-forget", line: "" },
];
let PLANTS_ROOT = null;
/* The copy used to be left in the temporary folder. Removing it with a recursive delete while
   the node_modules junction stood would follow that junction into the checkout, so nothing
   removed it, and every full run added another relay-studio-plants-* directory. The junction
   comes off first. A copy that will not go is named, and the checkout is left as it was.
   A hard kill runs no finally, so that copy stays until a later plants phase. The owner file
   names the process that made it, and the time that process started, so a reused process id
   is not treated as the same run. */
const PLANTS_OWNER = "plants-owner";
/* ok and a start time, or ok and an empty start time when that process is gone.
   Not ok means the question could not be answered, so the caller must not drop the copy.
   The start time is the machine lock's own reading (tools/machine-lock.mjs processStart: CIM on Windows, ps off it). The leg's own PowerShell-only query is gone: off
   Windows it could not answer, so the owner file was never written and the sweep never ran (Claude gamma's Linux sweep,
   2026-11-14). The tool answers "" both for a gone process and for a query that failed, so an empty answer for a PID that
   still answers kill(pid, 0) is "could not be answered", and the copy is left rather than dropped under a live run. */
function processStart(pid) {
  const id = String(Number(pid));
  if (!/^[1-9]\d*$/.test(id)) return { ok: false, why: "pid" };
  let at;
  try { at = lockProcessStart(Number(id)); }
  catch (e) { return { ok: false, why: (e && e.message) || String(e) }; }
  if (at === "") {
    try { process.kill(Number(id), 0); return { ok: false, why: "a live process whose start time could not be read" }; }
    catch (e) { if (e && e.code === "EPERM") return { ok: false, why: "a live process whose start time could not be read" }; }
    return { ok: true, started: "" };
  }
  /* Held as a Windows file time (100 ns ticks since 1601), the digits the owner file always carried, so a copy written by
     a run of the older leg still running beside this one reads as its own start and is not dropped under it. The tool's
     ISO reading carries seven fractional digits on Windows, exactly the ticks; ps off Windows gives whole seconds. */
  const frac = /\.(\d+)/.exec(at), whole = Date.parse(at.replace(/\.\d+/, ""));
  if (!Number.isFinite(whole)) return { ok: false, why: "start time" };
  const ticks = BigInt((frac ? frac[1] : "").padEnd(7, "0").slice(0, 7));
  return { ok: true, started: String((BigInt(whole) + 11644473600000n) * 10000n + ticks) };
}
function writePlantsOwner(copy) {
  const started = processStart(process.pid);
  if (!started.ok || !started.started) return false;
  const body = "pid " + process.pid + "\nstarted " + started.started + "\n";
  const dest = path.join(copy, PLANTS_OWNER);
  const tmp = dest + ".tmp";
  fs.writeFileSync(tmp, body);
  try { fs.unlinkSync(dest); } catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  fs.renameSync(tmp, dest);
  return true;
}
function readPlantsOwner(copy) {
  let text;
  try { text = fs.readFileSync(path.join(copy, PLANTS_OWNER), "utf8"); }
  catch (e) {
    if (e && e.code === "ENOENT") return null;
    return { error: (e && e.message) || String(e) };
  }
  const pid = /^pid ([1-9]\d*)$/m.exec(text);
  const started = /^started (\d+)$/m.exec(text);
  if (!pid || !started) return { error: "owner file is not a pid and a start time" };
  return { pid: Number(pid[1]), started: started[1] };
}
function releasePlantsCopy(copy) {
  if (!copy) return;
  dropPlantsTree(copy, ROOT);
  if (fs.existsSync(copy)) process.stderr.write("relay-studio plants copy remains: " + copy + "\n");
}
/* Before this process makes its own copy. A copy with no owner file was made before the owner
   file existed: leave it and name it. A copy whose owner is still that same start is left
   with nothing said. Anything else is dropped, junction first, and named if it will not go. */
function sweepAbandonedPlants(base = (process.env.RELAY_STUDIO_PLANTS_PARENT || os.tmpdir())) {
  let names;
  try { names = fs.readdirSync(base); }
  catch (e) {
    process.stderr.write("relay-studio plants sweep cannot list the temporary folder: " + ((e && e.message) || e) + "\n");
    return;
  }
  for (const name of names) {
    if (!name.startsWith("relay-studio-plants-")) continue;
    const dir = path.join(base, name);
    let st;
    try { st = fs.lstatSync(dir); }
    catch (e) {
      if (e && e.code === "ENOENT") continue;
      process.stderr.write("relay-studio plants copy unreadable, left: " + dir + "\n");
      continue;
    }
    if (!st.isDirectory()) continue;
    const owner = readPlantsOwner(dir);
    if (owner === null) {
      process.stderr.write("relay-studio plants copy has no owner, left: " + dir + "\n");
      continue;
    }
    if (owner.error) {
      process.stderr.write("relay-studio plants copy owner unreadable, left: " + dir + ": " + owner.error + "\n");
      continue;
    }
    const started = processStart(owner.pid);
    if (!started.ok) {
      process.stderr.write("relay-studio plants copy owner unreadable, left: " + dir + ": " + started.why + "\n");
      continue;
    }
    if (started.started === owner.started) continue;
    /* A hard kill can leave the directory locked for a moment. Try again, still junction first. */
    let gone = false;
    for (let i = 0; i < 125 && !gone; i++) {
      dropPlantsTree(dir, ROOT);
      gone = !fs.existsSync(dir);
      if (!gone) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
    if (gone) process.stdout.write("relay-studio plants copy dropped: " + dir + "\n");
    else process.stderr.write("relay-studio plants copy remains: " + dir + "\n");
  }
}
function makePlantsTree(base = (process.env.RELAY_STUDIO_PLANTS_PARENT || os.tmpdir())) {
  sweepAbandonedPlants(base);
  const copy = fs.mkdtempSync(path.join(base, "relay-studio-plants-"));
  try {
    /* Before the files are copied, so a kill during the copy still leaves an owner. */
    if (!writePlantsOwner(copy)) throw new Error("the owner file was not written");
    /* tools/ too: a leg imports tools/machine-lock.mjs, and a copy without it does not load (Claude gamma's Linux sweep, 2026-11-14). */
    for (const dir of ["src", "shell", "ui", "tests", "tools"]) {
      fs.cpSync(path.join(ROOT, dir), path.join(copy, dir), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, "engine", "pinned"), path.join(copy, "engine", "pinned"), { recursive: true });
    fs.copyFileSync(path.join(ROOT, "package.json"), path.join(copy, "package.json"));
    const nm = path.join(ROOT, "node_modules");
    if (fs.existsSync(nm)) {
      fs.symlinkSync(nm, path.join(copy, "node_modules"), "junction");
    }
    return copy;
  } catch (err) {
    releasePlantsCopy(copy);
    throw err;
  }
}
LEGS.rssweep = async () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "rssweep-run-"));
  const decoy = path.join(os.tmpdir(), "relay-studio-plants-decoy");
  fs.mkdirSync(decoy, { recursive: true });
  fs.writeFileSync(path.join(decoy, PLANTS_OWNER), "pid 999999\nstarted 1\n");

  const deadDir = fs.mkdtempSync(path.join(parent, "relay-studio-plants-dead-"));
  fs.writeFileSync(path.join(deadDir, PLANTS_OWNER), "pid 999999\nstarted 1\n");

  const liveDir = fs.mkdtempSync(path.join(parent, "relay-studio-plants-live-"));
  writePlantsOwner(liveDir);

  let deadGone = false;
  let liveLeft = false;
  let decoyUntouched = false;

  try {
    sweepAbandonedPlants(parent);
    deadGone = !fs.existsSync(deadDir);
    liveLeft = fs.existsSync(liveDir);
    decoyUntouched = fs.existsSync(decoy);
  } finally {
    try { fs.rmSync(decoy, { recursive: true, force: true }); } catch {}
    dropPlantsTree(parent, ROOT);
  }

  check(deadGone && liveLeft && decoyUntouched,
    "rssweep sweeps abandoned copies in its run parent and leaves os.tmpdir() decoys untouched");
};
/* The key files this run's labs wrote under scratch/. A lab folder's name carries this process's id
   (relay-lab labDir), and a file readKeyFile accepts is a signing key, whichever name the part gave it. */
function labKeyFiles() {
  const root = path.join(ROOT, "scratch");
  const mark = "-" + process.pid + "-";
  const out = [];
  let top = [];
  try { top = fs.readdirSync(root, { withFileTypes: true }); } catch { return out; }
  const walk = (dir) => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) {
        let read = null;
        try { read = readKeyFile(p); } catch { read = null; }
        if (read) out.push(read);
      }
    }
  };
  for (const e of top) if (e.isDirectory() && e.name.indexOf(mark) >= 0) walk(path.join(root, e.name));
  return out;
}
/* rsos. Every lab lead key this run wrote is the OS wrap, except a passphrase file its part named. */
/* THE RELAY'S ADDRESSED PLACE (board 1013, piece 2): an item at `to:<desk id>` is read by its addressee alone, as a desk's own mail.
   It is neither a desk's file nor a team blob, so Studio's listing of a since page passes over it. */
LEGS.rsto = async () => {
  const id = (c) => c.repeat(32);
  const entry = (c, place) => ({ meta: { id: id(c), place, writer: "k-" + "a".repeat(16) } });
  const list = [entry("a", "root"), entry("b", "desk:k-" + "1".repeat(16)), entry("c", "to:k-" + "2".repeat(16)), { meta: { id: 5 } }, null, {}];
  const got = typeof Relay.listedMetas === "function" ? Relay.listedMetas(list) : null;
  const ids = got instanceof Map ? Array.from(got.keys()).sort() : [];
  check(got instanceof Map && ids.length === 2 && ids[0] === id("a") && ids[1] === id("b") && !got.has(id("c")),
    "rsto the since listing keeps a root and a desk place and passes over an item addressed `to:<desk id>`, and over an entry with no id: "
    + JSON.stringify(ids.map((k) => k.slice(0, 1))));
};
LEGS.rsos = async () => {
  const keys = labKeyFiles();
  const passphrase = keys.filter((k) => k.kept !== OS_WRAP);
  const unnamed = passphrase.filter((k) => !passphraseOnPurpose.has(path.resolve(k.file)));
  const os = keys.filter((k) => k.kept === OS_WRAP);
  check(os.length > 0 && unnamed.length === 0 && passphrase.length > 0
      && passphrase.every((k) => passphraseOnPurpose.has(path.resolve(k.file))),
    "rsos every lab lead key the parts make is kept by the operating system (" + os.length + " os, " + passphrase.length
    + " passphrase, each passphrase file named by its part), and a passphrase file left unnamed is "
    + (unnamed.length ? unnamed.map((k) => k.file).join(", ") : "none"));
};
/* How long each leg took in this run, read by planted() to size its child's timeout. */
const legMs = {};
function planted(p, parent) {
  const tree = PLANTS_ROOT || ROOT;
  const at = path.join(tree, p.file), was = fs.readFileSync(at), text = was.toString("utf8");
  const targetMark = p.mark.replace(/^relay:/, "");
  const lines = text.split("\n"), hits = lines.map((l, i) => (l.indexOf("/* plant:" + targetMark + " */") >= 0 ? i : -1)).filter((i) => i >= 0);
  if (hits.length !== 1) return { ran: false, why: "the mark " + targetMark + " is on " + hits.length + " lines of " + p.file };
  const want = sha(was);
  if (typeof p.before === "string") {
    /* Put the marked line back where it stood before the lift: moved to stand before the one line that reads `p.before`, which
       comes after the catch-up and after the thread's look at the team. */
    const moved = lines[hits[0]];
    lines.splice(hits[0], 1);
    /* The first such line after the marked one, which is the one in its own act: three acts build the same ask line since
       2026-11-01, and a whole-file match would be ambiguous (the release profile of 2026-11-01 named it). */
    const to = lines.map((l, i) => (i >= hits[0] && l === p.before ? i : -1)).filter((i) => i >= 0).slice(0, 1);
    if (to.length !== 1) return { ran: false, why: "the line " + JSON.stringify(p.before) + " is on no line after the mark in " + p.file };
    lines.splice(to[0], 0, moved);
  } else lines[hits[0]] = p.line;
  /* A paired plant (`with`) lifts further marked lines of the same file in the same run, each to its own `line`: for a guard
     another guard now stands in front of, so that only both lifted together reach it (s2-owe behind s0b-st-owed-key since
     stage 0b). Each paired mark is on exactly one line, or the plant does not run. */
  for (const w of p.with || []) {
    const wHits = lines.map((l, i) => (l.indexOf("/* plant:" + w.mark + " */") >= 0 ? i : -1)).filter((i) => i >= 0);
    if (wHits.length !== 1) return { ran: false, why: "the paired mark " + w.mark + " is on " + wHits.length + " lines of " + p.file };
    lines[wHits[0]] = w.line;
  }
  fs.writeFileSync(at, lines.join("\n"));
  let r = null;
  const childSelf = path.join(tree, "tests", "relay-studio.mjs");
  try {
    const envExtra = { RELAY_STUDIO_ONLY: p.leg, RELAY_STUDIO_PLANT: "" };
    if (parent) {
      envExtra.RELAY_STUDIO_PLANTS_PARENT = parent;
      envExtra.TMPDIR = parent;
      envExtra.TEMP = parent;
      envExtra.TMP = parent;
    }
    /* THE CHILD'S TIMEOUT FOLLOWS THE LEG'S OWN MEASURED TIME, not one figure for all. rse4i and rse4j take 260 to 500 s under load,
       so a flat 180 s timed their plants out (MACHINE, five plant runs, 2026-11-22). The bound is three times what this process
       measured for the leg, and never under 180 s. A timeout is still no verdict (ran: false), never a pass. */
    const timeout = Math.max(180000, 3 * (legMs[p.leg] || 0));
    r = spawnSync(process.execPath, [childSelf], { cwd: tree, encoding: "utf8", timeout,
      env: Object.assign({}, process.env, envExtra) });
  } finally { fs.writeFileSync(at, was); }
  const back = sha(fs.readFileSync(at)) === want;
  /* A tree that would not load is no verdict and is said as such, never read as a plant left green: the child ran its leg only
     where it printed its #counts line (ERR_MODULE_NOT_FOUND in the copy read "STILL GREEN" for all 277, 2026-11-14). */
  if (!r || !/#counts /.test(r.stdout || "")) {
    const said = String((r && (r.stderr || r.stdout)) || (r && r.error && r.error.message) || "no output").split(/\r?\n/).map((l) => l.trim()).filter((l) => l).sort((x, y) => (/Error|ERR_/.test(y) ? 1 : 0) - (/Error|ERR_/.test(x) ? 1 : 0))[0] || "no output";
    return { ran: false, back, why: "the plants' scratch tree did not run " + p.leg + " (exit " + (r ? r.status : "none") + "): " + said.slice(0, 160) };
  }
  /* Red is a leg that ran and failed, never a tree that would not load. */
  return { ran: true, red: !!r && r.status !== 0 && /FAIL /.test(r.stdout || ""), back, out: ((r && r.stdout) || "").split("\n").filter((l) => /FAIL/.test(l)).join(" ").slice(0, 200) };
}

function checkoutSha(root) {
  const base = root || ROOT;
  const h = crypto.createHash("sha256");
  const files = [];
  for (const dir of ["src", "shell", "ui"]) {
    const dpath = path.join(base, dir);
    if (!fs.existsSync(dpath)) continue;
    function walk(curr, rel) {
      const entries = fs.readdirSync(curr, { withFileTypes: true });
      for (const ent of entries) {
        const entPath = path.join(curr, ent.name);
        const relPath = path.join(rel, ent.name).replace(/\\/g, "/");
        if (ent.isDirectory()) walk(entPath, relPath);
        else if (ent.isFile()) files.push({ relPath, fullPath: entPath });
      }
    }
    walk(dpath, dir);
  }
  files.sort((a, b) => a.relPath.localeCompare(b.relPath));
  for (const f of files) {
    h.update(f.relPath + "\0");
    h.update(fs.readFileSync(f.fullPath));
  }
  return h.digest("hex");
}

/* Holds one plants copy until this process is killed. A hard kill runs no finally, so the
   copy stays, owner file and junction included, for the next plants phase to drop.
   A timer keeps the process alive: a bare promise does not, and this process would exit
   while the top-level await was still unsettled. This stands in front of the legs. */
if (process.env.RELAY_STUDIO_PLANTS_HOLD === "1") {
  const flag = process.env.RELAY_STUDIO_PLANTS_HOLD_FLAG || "";
  let copy = "";
  try {
    copy = makePlantsTree();
    if (flag) fs.writeFileSync(flag, "COPY " + copy + "\n");
    process.stdout.write("relay-studio plants copy held " + copy + "\n");
  } catch (e) {
    releasePlantsCopy(copy);
    process.stderr.write("relay-studio plants hold failed: " + ((e && e.message) || e) + "\n");
    process.exit(1);
  }
  setInterval(() => {}, 1000);
}

/* Makes one plants copy and removes it. The plants phase itself has no switch, and it runs
   only when the whole file runs. This is how a run can show the copy does not stay.
   makePlantsTree first drops every earlier copy whose owner process is gone. */
if (process.env.RELAY_STUDIO_PLANTS_HOLD !== "1" && process.env.RELAY_STUDIO_PLANTS_DROP === "1") {
  let copy = "";
  try {
    copy = makePlantsTree();
    process.stdout.write("relay-studio plants copy made " + copy + "\n");
  } finally {
    releasePlantsCopy(copy);
  }
  const left = copy && fs.existsSync(copy);
  console.log(left ? "relay-studio plants copy remains: " + copy : "relay-studio plants copy removed");
  process.exit(left ? 1 : 0);
}

if (process.env.RELAY_STUDIO_PLANTS_HOLD !== "1" && process.env.RELAY_STUDIO_PLANTS_DROP !== "1") {
let skippedPlants = process.env.ETIUDA_PLANTS === "off" ? PLANTS.length + 2 : (PLANT_ONLY ? PLANTS.length - 1 : 0);
if (process.env.ETIUDA_PLANTS === "off") console.log("relay-studio: plants skipped (ETIUDA_PLANTS=off)");
try {
  for (const name of Object.keys(LEGS)) {
    if (ONLY.size && !ONLY.has(name)) continue;
    legName = name;
    const partStarted = Date.now();
    try {
      try { await LEGS[name](); } catch (e) { check(false, name + " threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" / ") : e)); }
      /* A leg that called done() without awaiting it has its stop in shellStops. Wait that out before judging, so the
         judgement is what is still going, and the next leg does not inherit it. */
      if (shellStops.length) {
        const jobs = shellStops.splice(0, shellStops.length);
        /* THE LOOP IS HELD OPEN WHILE A STOP IS WAITED OUT, and each stop has a bound (the test architect, 2026-11-10). A stop
           waits on the shell's own timers, some of them unref'd; with nothing else alive (a narrowed run, or a moment under
           load in a whole one) node found the loop empty and exited 13 on this await, mid-run and with no check said: Studio
           fold 8's landing, at rs926j. Now the stop either settles or is named. */
        const holdOpen = setInterval(() => {}, 1000);
        try {
          for (const job of jobs) {
            let bound = null;
            const late = new Promise((r) => { bound = setTimeout(() => r("late"), 60000); });
            const how = await Promise.race([job.then(() => "done", () => "done"), late]);
            clearTimeout(bound);
            if (how === "late") check(false, name + " left a shell stop that did not settle within 60 s");
          }
        } finally { clearInterval(holdOpen); }
      }
      const left = leftovers();
      if (left.length) {
        check(false, name + " left " + left.join(", ") + " running");
        await releaseLeftovers();
      }
    } finally {
      legMs[name] = Date.now() - partStarted;
      console.log("#part " + name + " " + legMs[name] + " ms");
    }
  }
  if (!ONLY.size || PLANT_ONLY) {
    if (process.env.ETIUDA_PLANTS !== "off") {
      const checkoutBefore = checkoutSha();
      let scratch = null;
      const plantsParent = fs.mkdtempSync(path.join(os.tmpdir(), "relay-plants-run-"));
      try {
        scratch = makePlantsTree(plantsParent);
        PLANTS_ROOT = scratch;
        for (const p of PLANTS) {
          if (PLANT_ONLY && p.mark !== PLANT_ONLY) continue;
          const r = planted(p, plantsParent);
          check(r.ran && r.red && r.back, "plant " + p.mark + (p.with ? " with " + p.with.map((w) => w.mark).join(" and ") : "")
            + (p.before ? " put back after the catch-up" : "") + " in " + p.file + " turns " + p.leg + " red and the file comes back by sha256: "
            + (r.ran ? (r.red ? "red" : "STILL GREEN") + ", " + (r.back ? "restored" : "NOT RESTORED") : r.why));
        }
        check(checkoutSha() === checkoutBefore, "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
        const simTree = PLANTS_ROOT || ROOT;
        const simAt = path.join(simTree, PLANTS[0].file);
        const simWas = fs.readFileSync(simAt);
        const simLines = simWas.toString("utf8").split("\n");
        const simHit = simLines.findIndex((l) => l.includes("/* plant:" + PLANTS[0].mark + " */"));
        if (simHit >= 0) {
          simLines[simHit] = PLANTS[0].line;
          fs.writeFileSync(simAt, simLines.join("\n"));
        }
        const simClean = checkoutSha() === checkoutBefore;
        if (!PLANTS_ROOT) {
          fs.writeFileSync(simAt, simWas);
        }
        check(simHit >= 0 && simClean, "a plant child killed mid-plant leaves the checkout unchanged (the plant found its mark " + (simHit >= 0) + ")");
      } finally {
        const copy = scratch;
        PLANTS_ROOT = null;
        releasePlantsCopy(copy);
        dropPlantsTree(plantsParent, ROOT);
      }
    }
  }
} catch (e) {
  check(false, "harness: " + (e && e.stack ? e.stack : e));
}
skippedPlants += liftsSkipped;
console.log("#counts checks=" + asserted + " failed=" + failed + (skippedPlants ? " skipped=" + skippedPlants : ""));
console.log(failed ? "  RESULT: FAIL " + failed + " of " + asserted : "  RESULT: ok " + asserted + " check(s)" + (skippedPlants ? ", " + skippedPlants + " plant(s) skipped" : ""));
process.exit(Math.min(failed, 63));
}
