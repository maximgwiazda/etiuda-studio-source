"use strict";
/* THE TWO LANGUAGES.
 *
 * Every pair below is Claudette's, from `copywriter-studio-polish.md` of 2026-09-17, landed in
 * her key order and word for word; nothing here is translated by this seat. Where she marks a
 * pair as already in the table it sits in the section she put it in rather than where it used to
 * be, so the file and her sheet can be read side by side top to bottom.
 *
 * ONE SECTION HAS A SECOND SOURCE AND IT IS NAMED AT ITS HEAD: pairs the ENGINE'S OWN table
 * already carries. A word the engine paints on a desk today, with the Polish it paints beside
 * it, is not a word invented at this keyboard - it is wording that is already in the product and
 * has been read by whoever uses it - and Studio saying Delete where the engine says Delete is
 * the two programs agreeing rather than the second one guessing. Each such pair carries the
 * engine key it was taken from so a reader can check it against the pin in one grep.
 *
 * THE LANGUAGE IS DECIDED BY THE TABLE RATHER THAN BY A SWITCH, AND ONE SCREEN AT A TIME.
 * `ready(screen)` is true only when every English string THAT SCREEN can ask for has a twin, and
 * until then that screen is English whatever the desk's locale says, because half a screen in
 * each language is worse than either. What blocks it is `NO_TWIN` below, which names those
 * strings under the screens that paint them. Maxim ruled the per-screen rule on 2026-09-18
 * (board 468); before it one word with no Polish kept the whole interface English, which made
 * every screen wait on the slowest.
 *
 * READY IS ANSWERED FROM A DECLARED LIST, NOT FROM WHAT HAS BEEN ASKED SO FAR. It used to be
 * answered from the strings the screens had asked for by then, and `set()` is called at boot
 * before the first paint, so the list was empty and `every` over an empty list is true: a Polish
 * desk turned Polish and then rendered English wherever a pair was missing - the exact failure
 * the mechanism exists to prevent, and it was invisible while only one screen had Polish at all.
 * Fixed 2026-09-17; `tests/polish.mjs` asserts that every literal `ui/app.js` passes to T(), C()
 * or a frame is either a key of PL or a declared NO_TWIN, so the list cannot go stale quietly,
 * and it walks a Polish desk screen by screen to hold each one to its own answer.
 *
 * A COMMENT BETWEEN A KEY AND ITS VALUE HIDES THE PAIR FROM THAT GATE. It reads this file as
 * TEXT rather than as a module, on purpose - a second implementation of the table is the whole
 * point of it - and its regex allows one newline between the two strings and nothing else. So a
 * note about a pair goes ABOVE the key, never between the key and its Polish; measured
 * 2026-09-18, two pairs written the other way were reported as having no twin at all.
 *
 * A COUNTED NOUN TAKES THREE FORMS IN POLISH and `C()` below is the engine's own `counted()`
 * rule, unchanged (`src/modules/ui-lang.js` at the pin, line 869), so the two programs count
 * alike. Two differences of storage and neither of rule: the engine keeps its few-form under a
 * key with a unit separator inside it, and this file keeps a second table instead, because an
 * invisible control byte in a source file is a thing this repository has already been bitten by;
 * and the engine's Polish literals carry the no-break space between {N} and the noun, while the
 * literals here carry an ordinary space and `C()` puts the no-break space in, so no invisible
 * byte sits in this file either. The output is the same and the leg measures the byte.
 */
(function () {
  const NB = String.fromCharCode(160);        /* U+00A0, built rather than typed */

  /* ---- the pairs ------------------------------------------------------------------------- */

  const PL = {
    /* The update offer (board 991): the copywriter's, 2026-11-11, words-991-update-offer-2026-11-11.md in the office. */
    "Etiuda Studio {VERSION} is available": "Dostępna jest nowa wersja Etiudy Studio: {VERSION}",
    "See what's new": "Co nowego",
    "Opens the page of this release": "Otwiera stronę tego wydania",
    "{VERSION} available": "dostępna {VERSION}",
    "This version: {VERSION}": "Ta wersja: {VERSION}",
    "Newest available: {VERSION}": "Najnowsza dostępna: {VERSION}",
    "This is the newest version.": "To najnowsza wersja.",
    "Whether a newer version exists could not be checked just now. This one works as it is.":
      "Nie udało się teraz sprawdzić, czy jest nowsza wersja. Ta działa bez zmian.",

    /* Section 13, an erased person's desks taken off a team: the copywriter's, 2026-11-13, words-studio-erase-2026-11-13.md in the office. */
    "A person on this team asked for their data to be deleted from Etiuda, so their desks were taken off the team: {N}.":
      "Osoba z zespołu poprosiła o usunięcie swoich danych z Etiudy, więc jej stanowiska zostały usunięte z zespołu: {N}.",

    /* copywriter, 2026-10-30 00:20 */
    "Teammates are waiting to join, and this Studio cannot let them in while its licence is paused. Signing in with an account that holds a licence, from the Menu, under Settings, then Account, ends the pause, and they are let in by themselves.": "Członkowie zespołu czekają na dołączenie, ale to Studio nie może ich wpuścić, dopóki jego licencja jest wstrzymana. Zalogowanie się kontem z licencją, z menu, w Ustawieniach, w części Konto, kończy wstrzymanie, a oni dołączą sami.",

    "Copy and make another": "Kopiuj i utwórz kolejne",
    "One name a line. Each gets an invitation of its own, and each link works once.":
      "Jedno imię w wierszu. Każda osoba dostanie własne zaproszenie, a każdy odnośnik zadziała jeden raz.",
    "Make an invitation for each name": "Utwórz zaproszenie dla każdego imienia",
    "Invitations made: {N}, one for each name. Each link works once.":
      "Utworzono zaproszenia: {N}, po jednym dla każdego imienia. Każdy odnośnik zadziała jeden raz.",
    /* F5 and F9, the copywriter's (2026-11-01, ffffa87c and 56e3a11d) */
    "This catalog has no cards yet, so the import comes into it rather than making a new catalog, and its rows go straight in rather than waiting in Proposals.":
      "Ten katalog nie ma jeszcze kart, więc import trafi do niego, zamiast tworzyć nowy katalog, a wiersze od razu do niego wejdą, zamiast czekać w Propozycjach.",

    /* The relative clock, `ago()`. */
    "a moment ago": "przed chwilą",
    "today": "dzisiaj",
    "1 day ago": "dzień temu",
    "{N} day ago": "{N} dzień temu",
    "{N} days ago": "{N} dni temu",
    "1 week ago": "tydzień temu",
    "{N} week ago": "{N} tydzień temu",
    "{N} weeks ago": "{N} tygodni temu",
    "{N} month ago": "{N} miesiąc temu",
    "{N} months ago": "{N} miesięcy temu",
    "{N} year ago": "{N} rok temu",
    "{N} years ago": "{N} lat temu",

    /* The month abbreviations, `MONTHS`. The engine's own fileStamp() refuses month names and
       prints digits, because a locale-formatted date follows the machine rather than the
       interface; Studio's when() is not locale-formatted, so these are safe. */
    "Jan": "sty", "Feb": "lut", "Mar": "mar", "Apr": "kwi",
    "May": "maj", "Jun": "cze", "Jul": "lip", "Aug": "sie",
    "Sep": "wrz", "Oct": "paź", "Nov": "lis", "Dec": "gru",

    /* The band and the chrome row. The tab's `rev` chip stays rev, untranslated, as the publish
       cover already keeps it. */
    /* The tab's and the Publish button's revision is a frame of its own, apart from the Library's and the Overview's "rev {N}",
       which says "wersja {N}" in full (polish 02, fault 23; the copywriter, 2026-11-11). The no-break space is the frame's, since fill()
       binds a number to a word before it and this one ends in a full stop. A draft, a placeholder for the copywriter. */
    "rev {REV}": "wer.\u00a0{REV}",
    "Library": "Biblioteka",
    "Overview": "Przegląd",
    "This Studio at a glance: its catalogs, their cards and editions, and the teams they reach.": "To Studio w skrócie: katalogi, ich karty i wydania oraz zespoły, do których trafiają.",
    "Search catalogs": "Szukaj katalogów",
    "Open a folder": "Otwórz folder",
    "New catalog": "Nowy katalog",
    "Close catalog": "Zamknij katalog",
    "Search cards, intents and categories": "Szukaj kart, intencji i kategorii",
    "All": "Wszystkie",
    "Published": "Opublikowane",
    "Read by a team": "Czytane przez zespół",
    "Start": "Na początek",
    "Errors": "Błędy",
    "Warnings": "Ostrzeżenia",
    "Import a file": "Importuj plik",
    /* THE CHROME ROW'S DOOR, REWORDED (board 539, frame B). Claudia measured the faithful
       Polish, "Importuj do tego projektu", overflowing the row by 14px at the ruled 546px
       minimum she works to; `tego` carries nothing the sentence needs - one project is open
       and the button sits in that project's own chrome row - so it goes and the label fits. */
    "Import into this catalog": "Importuj do katalogu",
    /* The copywriter's words, 1c1fef45 (board 955, condition 9): a project folder inside a synced cloud folder. */
    "This folder is inside {CLOUD}, and its syncing can lose what Studio writes here. The catalog is safer on this computer's own disk, with only the team's shared folder in {CLOUD}.":
      "Ten folder leży w usłudze {CLOUD}, a jej synchronizacja może zgubić to, co Studio tu zapisuje. Katalog jest bezpieczniejszy na dysku tego komputera, a w tej usłudze wystarczy trzymać wspólny folder zespołu.",
    "This folder is inside a synced cloud folder, and its syncing can lose what Studio writes here. The catalog is safer on this computer's own disk, with only the team's shared folder synced.":
      "Ten folder leży w folderze synchronizowanym z chmurą, a synchronizacja może zgubić to, co Studio tu zapisuje. Katalog jest bezpieczniejszy na dysku tego komputera, a synchronizować wystarczy wspólny folder zespołu.",
    /* A draft, the copywriter's to replace. */
    "Choose a file": "Wybierz plik",
    /* Claudette's words, 2026-11-02, board 956. The hint names a heading because the paste
       area reads the clipboard's HTML (src/paste.mjs headingsOf). */
    "Paste text": "Wklej tekst",
    "Replies to bring in": "Odpowiedzi do zaimportowania",
    /* S2: paste splitter rule */
    "Paste replies from OneNote, Word, Google Docs or any text file. Each heading starts a new card, and blank lines stay inside it; in text with no headings, a blank line starts a new card. Each card's first line becomes its title.": "Można tu wkleić odpowiedzi z OneNote, Worda, Dokumentów Google albo dowolnego pliku tekstowego. Każdy nagłówek zaczyna nową kartę, a puste linie zostają w jej treści; w tekście bez nagłówków nową kartę zaczyna pusta linia. Pierwsza linia każdej karty staje się jej tytułem.",
    "Split into cards": "Podziel na karty",
    "Split into cards opens once text is pasted above.": "Podział na karty będzie możliwy, gdy powyżej pojawi się wklejony tekst.",
    "Replies found: {N}": "Znalezione odpowiedzi: {N}",
    "Replies found: {N} ({LANGS})": "Znalezione odpowiedzi: {N} ({LANGS})",
    "Next: where it lands": "Dalej: gdzie trafia",
    "Studio found one reply only, as the text has no blank line or heading to split on. If it holds several, a blank line between them splits it.": "Studio znalazło tylko jedną odpowiedź, bo w tekście nie ma pustej linii ani nagłówka. Jeśli to kilka odpowiedzi, wystarczy oddzielić je pustą linią.",
    "Which language are these replies in?": "W jakim języku są te odpowiedzi?",
    "Publish": "Publikuj",
    "Theme": "Motyw",
    "Test service": "Usługa testowa",
    "Menu": "Menu",

    /* The rail. */
    "Opened recently": "Ostatnio otwierane",
    "The catalog": "Katalog",
    "Cards": "Karty",
    "Intents": "Intencje",
    "Categories": "Kategorie",
    "Work on it": "Praca nad katalogiem",
    "Import": "Import",
    "Proposals": "Propozycje",
    "Archive": "Archiwum",
    "{N} rev": "{N} wersja",
    "{N} revs": "{N} wersji",
    /* The status bar's arrival line counts FILES with a row still waiting. */
    "{N} file": "{N} plik",
    "{N} files": "{N} plików",

    /* THE REVIEW DISC'S TITLE IS A HEAD LABEL BEHIND A COLON, the count after it bare, as the review door counts. */
    "Review: {WAITING}": "Przegląd: {WAITING}",

    /* The project list. */
    "A catalog is one folder on disk: its draft, its published editions and its details.":
      "Katalog to jeden folder na dysku: szkic, opublikowane wydania i szczegóły katalogu.",
    "Written to": "Miejsce zapisu",
    "never published": "jeszcze nie opublikowano",
    "no folder chosen yet": "nie wybrano jeszcze folderu",
    /* Statistics, in place of the line above, and only there. Claudette, 2026-11-10. */
    "Statistics counts what teammates' desks report through the team. Once the catalog is on a team, the counting period appears here, and the figures with the first answers.":
      "Statystyki zliczają to, co stanowiska członków zespołu przekazują przez zespół. Gdy katalog trafi do zespołu, pojawi się tu okres liczenia, a liczby wraz z pierwszymi odpowiedziami.",
    /* The empty Team screen's second line (board 976, item 8). */
    "Open": "Otwórz",

    "rev {N}": "wersja {N}",
    "Catalogs are kept in {DIR}.": "Katalogi są przechowywane w folderze {DIR}.",
    "The folder {DIR} is not there yet; the first new catalog will make it.":
      "Folderu {DIR} jeszcze nie ma; utworzy go pierwszy nowy katalog.",
    "Open the sample catalog": "Otwórz przykładowy katalog",
    "A made-up shop's catalog in English and Polish, the same one the desk has, to look round in. It opens as a catalog of your own, to change, rename, publish or remove like any other.":
      "Katalog wymyślonego sklepu po angielsku i po polsku, ten sam, który ma stanowisko, do swobodnego przejrzenia. Otwiera się jak własny katalog: można go zmieniać, zmienić mu nazwę, opublikować albo usunąć jak każdy inny.",

    /* The cards table. */
    "Card": "Karta",
    /* The statistics lists head the identifier Id (board 976, item 9). The sheet upper-cases
       every head, so the eye reads ID. The copywriter's brief did not name this word; the
       handoff did, and both languages use the same letters. */
    "Id": "Id",
    "Category": "Kategoria",
    "English": "Angielski",
    "Polish": "Polski",
    "Intent": "Intencja",
    /* THE KEYWORD BOX AND ITS ONE SENTENCE (board 597). The engine paints no sentence about
       what a bag is for, so there was nothing to borrow from the pin; the label is this seat's
       draft, which the copywriter kept, and the sentence is hers (board 744). */
    "Keywords": "Słowa kluczowe",
    "Keywords are a place for words somebody might search for that the card's own text does not contain. A word already in the title or the text is found without them.":
      "Tu wpisuje się słowa, którymi ktoś może szukać tej karty, a których nie ma w jej tytule ani treści. Słów z tytułu i treści nie trzeba powtarzać.",
    "Who": "Kto",
    "Last edit": "Ostatnia zmiana",
    "full": "jest",
    "empty": "brak",
    "{N} card": "{N} karta",
    "{N} cards": "{N} kart",
    "{N} part": "{N} część",
    "{N} parts": "{N} części",
    /* THE AWAITING STATE ON THE CARDS SCREEN (board 544). The language arrives as its CODE
       since board 532 - two capitals, which cannot inflect and need not - so the Polish puts it
       behind the preposition the English puts it behind and neither has a case to get wrong.
       The strip's own sentence is the publish cover's, further down this file, rather than a
       second wording of one state. */
    "awaiting {LANG}": "czeka na {LANG}",
    "Show only these": "Pokaż tylko te",
    "Show all": "Pokaż wszystkie",

    /* The lint list. */
    "What the checks found": "Co wykazała kontrola",
    "Run on open, on import, and again before you publish. Jump goes to the card with the finding still on screen.":
      "Kontrola działa przy otwarciu katalogu, po imporcie i jeszcze raz przed publikacją. Przycisk Przejdź do karty otwiera kartę, a uwaga zostaje przy niej na ekranie.",
    "What is wrong": "Co jest nie tak",
    "Where": "Gdzie",
    "Why it fired": "Dlaczego się pojawiła",
    "Error": "Błąd",
    "Warning": "Ostrzeżenie",
    "Jump to it": "Przejdź do karty",
    "Publishing with them needs a note saying why, and the note is kept in the archive.":
      "Publikacja mimo nich wymaga notatki z uzasadnieniem, a notatka zostaje w archiwum.",
    /* THE LIST'S THIRD KIND (board 544). `Czeka` is the third severity's pill beside Błąd and
       Ostrzeżenie, and it is the one word on the segment that filters to it, because the pill
       and the filter item name the same thing and two words for it would be two things. The
       sentence under the table reports Maxim's ruling of board 510 - a language nobody has
       written yet is a state - and it is the same sentence the wizard's pane says. */
    "Awaiting": "Czeka",
    "the whole catalog": "cały katalog",
    "Show the cards": "Pokaż te karty",
    "It is a state, not a fault: the draft publishes as it stands, and the count travels with it.":
      "To stan, a nie błąd: szkic można opublikować w obecnej postaci, a ta liczba zostanie w nim"
      + " zapisana.",

    /* The publish cover, from the canvas's publish-pl screen, word for word, with the heading
       as Claudette corrected it: the colon goes and the noun the name belongs to carries it. */
    "Publish {name}": "Publikacja katalogu {name}",
    /* The line under that title (board 873): every desk that reads the folder is offered the edition. */
    "Every desk that reads the folder is offered this edition, and nothing changes for anyone until they accept it.":
      "Każde stanowisko, które czyta ten folder, dostanie propozycję tego wydania, a u nikogo nic się nie zmieni, dopóki jej nie przyjmie.",
    "The checks ran a moment ago, on the draft.":
      "Kontrola szkicu odbyła się przed chwilą.",
    /* WHAT THE DRAFT IS AWAITING, IN ITS TWO SHAPES (board 538, Claudette's third pass).
       `langName()` hands {LANG} over nominative and capitalised - Angielski, Polski, or an
       unknown code in capitals - so it cannot inflect inside a clause: Polish takes it as a
       label at the head, behind the colon, which is the second of the three shapes this file
       already names for a counted line. The count then falls after a comma as a bare quantity,
       the third shape, where C()'s nominative is right at every number. `na {CARDS}` would read
       well at 3 and at 12 and wrong at 1, since C() hands back `1 karta` and the accusative
       wants `kartę`; that is the frame to refuse if a shorter line is ever wanted. */
    "Awaiting its {LANG} text on {CARDS}.":
      "{LANG}: tekst jeszcze do uzupełnienia, {CARDS}.",
    "Awaiting its {LANG} text.": "{LANG}: tekst jeszcze do uzupełnienia.",
    "Publish with the warnings unfixed": "Publikuj mimo ostrzeżeń",
    "Rev": "Wersja",
    "rev {a} becomes rev {b}": "wersja {a} zmieni się na {b}",
    "The last publish was {when}.": "Ostatnia publikacja: {when}.",
    "Edition": "Wydanie",
    "Stamped for you. A second publish today would be {edition}.":
      "Nadawane automatycznie. Druga publikacja tego samego dnia dostanie {edition}.",
    "Notes": "Notatki",
    "What changed in this rev": "Co zmieniło się w tej wersji",
    /* Polish 03, item 9: the label of the note publishing over errors needs. Placeholder Polish
       for the copywriter. */
    "Why these can go out as they are": "Dlaczego mogą wyjść w tej postaci",
    "Kept in the archive beside the file, and readable there forever.":
      "Zostają w archiwum obok pliku, na stałe.",
    /* The lead's note for an edition (C08, 2026-10-04). Placeholder Polish for the copywriter,
       written with the English, which is hers to replace as well. */
    "Note for this edition": "Notatka do tego wydania",
    "What the agents should know about this edition": "Co agenci powinni wiedzieć o tym wydaniu",
    "Shown to each agent when the file is offered, in their language where you wrote one. Leave it empty to send none.":
      "Pokazywana każdemu agentowi, gdy plik jest proponowany, w jego języku, jeśli taka wersja została napisana. Zostaw puste, żeby nic nie wysyłać.",
    "Writes to": "Miejsce zapisu",
    "File name": "Nazwa pliku",
    "Every desk will list the catalog under this name.":
      "Pod tą nazwą katalog pojawi się na każdym stanowisku.",
    "Each one offers the file to the person at it; none loads it on its own.":
      "Każde stanowisko zaproponuje plik osobie, która przy nim pracuje; żadne nie wczyta go samo.",
    "a copy of rev {n} in the catalog's archive": "kopia wersji {n} w archiwum katalogu",
    "Cancel": "Anuluj",
    "Publish rev {n}": "Opublikuj wersję {n}",
    "{N} error": "{N} błąd",
    "{N} errors": "{N} błędów",
    "{N} warning": "{N} ostrzeżenie",
    "{N} warnings": "{N} ostrzeżeń",

    /* THE PRESS, the Publishing window (decisions 2026-10-07 00:49, 22:15, 23:49): its words are Claudia's placeholders and
       the Polish is the engineer's, written from what each line is for; both are the copywriter's to replace. */
    "Second today": "Druga tego dnia",
    "{N} card changed": "{N} karta zmieniona",
    "{N} cards changed": "{N} kart zmienionych",
    "{N} card retired": "{N} karta wycofana",
    "{N} cards retired": "{N} kart wycofanych",
    "{N} card as in rev {REV}": "{N} karta jak w wer. {REV}",
    "{N} cards as in rev {REV}": "{N} kart jak w wer. {REV}",
    "{N} card goes out in rev {REV}": "{N} karta wychodzi w wer. {REV}",
    "{N} cards go out in rev {REV}": "{N} kart wychodzi w wer. {REV}",
    "{N} card, new": "{N} karta, nowa",
    "{N} cards, every one new": "{N} kart, wszystkie nowe",
    "The first edition of {name}": "Pierwsze wydanie katalogu {name}",
    "Since rev {REV}: nothing yet": "Od wer. {REV}: jeszcze nic",
    "Checks": "Kontrola",
    "{A} of {B}": "{A} z {B}",
    "Every card has its text in each language.": "Każda karta ma tekst we wszystkich językach.",
    "The name every desk lists it under, fixed by the first publish.":
      "Pod tą nazwą katalog widnieje na każdym stanowisku; ustaliła ją pierwsza publikacja.",
    "Sealed for the team: only an admitted teammate can open it.":
      "Zapieczętowane dla zespołu: otworzy je tylko przyjęty członek zespołu.", /* plant:txrw-rw1-4 */
    "for the archive": "do archiwum",
    "Where it goes": "Dokąd trafia",
    "{N} teammate admitted reads this folder.": "Przyjęci członkowie zespołu czytający ten folder:\u00a0{N}.",
    "{N} teammates admitted read this folder.": "Przyjęci członkowie zespołu czytający ten folder:\u00a0{N}.",
    "{N} more is named and not admitted yet.": "{N} kolejne jest nazwane, ale jeszcze nieprzyjęte.",
    "{N} more are named and not admitted yet.": "{N} kolejnych jest nazwanych, ale jeszcze nieprzyjętych.",
    "Enter publishes; Esc goes back to the cards.": "Enter publikuje, Esc wraca do kart.",
    "Publishing rev {n}": "Publikowanie wersji {n}",
    "Any desk": "Każde stanowisko",
    "not admitted": "nieprzyjęte",
    "reads this folder": "czyta ten folder",
    "has rev {REV}": "ma wer. {REV}",
    "offers rev {REV}": "proponuje wer. {REV}",
    "cannot open rev {REV}": "nie otworzy wer. {REV}",
    "has the new edition": "ma nowe wydanie",
    "named, not admitted": "nazwane, nieprzyjęte",
    "nothing yet": "jeszcze nic",
    "nothing published yet": "jeszcze nic nie opublikowano",
    "{FILE}, rev {REV}": "{FILE}, wer. {REV}",
    /* Claudette's words, 2026-10-28 */
    "The edition is in the team's folder.": "Wydanie jest już w folderze zespołu.",
    /* Claudette's words, 2026-10-27 */
    "Each running desk takes the file once the relay has it and offers it to the person at it; a desk that is closed finds it when it next starts.":
      "Każde włączone stanowisko weźmie plik, gdy tylko dotrze on do przekaźnika, i zaproponuje go osobie, która przy nim pracuje; wyłączone znajdzie go przy następnym uruchomieniu.",
    "Rev {N} is in the folder.": "Wersja {N} jest już w folderze",
    /* Claudette's words, 2026-11-15 (Grok's review 29, finding 2) */
    "The folder already held rev {N} of this catalog, newer than this project's, so this edition went out above it.":
      "W folderze była już wersja {N} tego katalogu, nowsza niż w tym projekcie, więc to wydanie wyszło z wyższym numerem.",
    "Edition {EDITION}.": "Wydanie {EDITION}.",
    "The edition is published. The team will have it shortly, and nothing more needs doing.": "Wydanie jest opublikowane. Zespół dostanie je wkrótce i nic więcej nie trzeba robić.",
    /* Claudette's words, 2026-10-27 */
    "The relay could not be reached just now. The edition is written, and Studio sends it at its next look, within a few minutes; nothing more needs doing.":
      "Nie udało się teraz połączyć z przekaźnikiem. Wydanie jest zapisane, a Studio wyśle je przy następnym sprawdzeniu, w ciągu kilku minut; nic więcej nie trzeba robić.",
    "Open the archive": "Otwórz archiwum",

    /* ---- CLAUDETTE'S SECOND PASS, 2026-09-18 -------------------------------------------------
       Everything from here to the engine's section is `copywriter-studio-pass-2.md`, landed in
       her own order and word for word, under Maxim's rulings of the third meeting (468, 479 and
       run m). Her notes are not repeated here; what IS repeated is any note that would stop a
       later reader from "tidying" a line back into something Polish cannot say, and each of
       those sits beside its own pair. */

    /* The import wizard's rail, its steps and its foot. */
    /* THE FIRST STEP WAS CALLED "Map the columns" UNTIL BOARD 642. It is a cover about the file
       now and the mapping table is one pane of it, so the name is the question the cover asks.
       Przypisz kolumny is kept nowhere: a step name nothing says is a pair nothing can check. */
    "What is in this file": "Co jest w tym pliku",
    "Languages and duplicates": "Języki i duplikaty",
    "Land it as a draft": "Zapisz jako szkic",
    "Start over": "Zacznij od nowa",
    "The file": "Plik",
    /* Kept as a pair though the two sides are the same string, so a language wanting another
       order has somewhere to say so. */
    "{ROWS}, {COLS}, {ENC}": "{ROWS}, {COLS}, {ENC}",
    /* And the same for a file the reader found one column in: the rail says what the READER
       found, not the shape of the table derived from it (642). */
    "{CELLS}, {ENC}": "{CELLS}, {ENC}",
    "Next: languages and duplicates": "Dalej: języki i duplikaty",
    /* Placeholder, polish 04 item 7: the copywriter's to replace. */
    "Next opens once a column holds the text.":
      "Przejście dalej będzie możliwe, gdy któraś kolumna będzie zawierać tekst.",
    "Next: land it as a draft": "Dalej: zapisz jako szkic",
    "Go to the cards": "Przejdź do kart",
    "Open the checks": "Otwórz wyniki kontroli",

    /* The wizard's first cover, the columns. */
    /* NO FINITE VERB AFTER THE COUNT: 3 kolumny nie należą against 5 kolumn nie należy, and
       C() gives the nominative only. The count sits after w tym, where nothing agrees with it,
       and the reason follows as its own sentence with to, which does not inflect. */
    /* THE COLUMN COUNT MOVED TO THE READING (642), where it sits behind a label with the row
       count, so this line says only what stays out. A head and a colon, and the quantity last,
       which is the one shape a count can take in a Polish frame. */
    "Columns that stay out, because they are not catalog content: {OUT}.":
      "Kolumny pominięte, bo nie zawierają treści katalogu: {OUT}.",
    "Column in the file": "Kolumna w pliku",
    "Becomes": "Staje się",
    /* Reads is dropped: the cell under this heading is the value itself. */
    "First row reads": "Pierwszy wiersz",
    "Do not import": "Nie importuj",

    /* THE COVER THAT SHOWS THE FILE (642, variant B, Maxim 2026-09-21 12:26). Every count here
       sits behind a label and a colon or after a comma, with nothing agreeing with it: a frame
       cannot inflect, and "3 komórki w kółko" reads for two to four exactly as
       "5 komórek w kółko" reads for five. The two pane names are questions about
       the file rather than labels on a thing, which is why they are nominal in both languages. */
    "The top of the file": "Początek pliku",
    "Under the heading row: {ROWS}.": "Pod wierszem nagłówków: {ROWS}.",
    "The file itself": "Sam plik",
    "and so on. In all: {TIMES}.": "i tak dalej. W sumie: {TIMES}.",
    "How it was read": "Jak to odczytano",
    "What is in it": "Co w nim jest",
    "{ROWS}, {COLS}.": "{ROWS}, {COLS}.",
    "{CELLS}, no heading row.": "{CELLS}, bez wiersza nagłówków.",
    "The pattern": "Wzorzec",
    "{CELLS} over and over, {TIMES}.": "Powtarza się: {CELLS}, {TIMES}.",
    "The last repeat is short, which is what an export that stopped where its content stopped looks like; the missing cells were read as empty.":
      "Ostatnie powtórzenie jest krótsze, jak w eksporcie, który kończy się razem z treścią;"
      + " brakujące komórki odczytano jako puste.",
    /* THE FORK STATED RATHER THAN ASKED, which is the ruling wherever structure was found: a
       model would be spending a key on a question already answered. Said on every import and not
       only on the ones where something leaves, because it is the program's promise about a
       customer's content. */
    "Where it was read": "Gdzie to odczytano",
    "Here, on this computer.": "Tutaj, na tym komputerze.",
    "Nothing was sent anywhere, and nothing needed to be.":
      "Nic nigdzie nie zostało wysłane i nie było takiej potrzeby.",
    "The headings, and what each becomes": "Nagłówki i pola, do których trafiają",
    "Each position, and what it becomes": "Pozycje w cyklu i pola, do których trafiają",
    "A spreadsheet with a heading row. Studio read the headings and matched each one to a field of its own.":
      "Arkusz z wierszem nagłówków. Studio odczytało nagłówki i"
      + " dopasowało każdy do osobnego pola.",
    "One column that comes round in a cycle. Studio read the repeat and gave each position in it a field.":
      "Jedna kolumna, w której treść powtarza się w stałym cyklu. Studio rozpoznało ten cykl i"
      + " każdej pozycji przypisało pole.",
    "Studio read this file as one column.":
      "Studio odczytało ten plik jako jedną kolumnę.",
    "Title": "Tytuł",
    "Text": "Treść",

    /* The wizard's second cover, what the file looks like. */
    "What the file looks like": "Jak wygląda plik",
    /* Gdybyś przeszedł picks a sex for the reader; po przejściu dalej is a noun phrase and
       picks none. Every past and conditional in this table is written the same way. */
    "Nothing is decided yet. This is what would happen if you continued.":
      "Tak będzie wyglądał import po przejściu dalej; wszystko można jeszcze zmienić.",
    "Languages": "Języki",
    "{CODE} from {COLUMN}, {ROWS}, text reads {READS}":
      "{CODE} z kolumny {COLUMN}, {ROWS}, tekst rozpoznany jako {READS}",
    "nothing": "brak",
    /* Fills {READS} above, so it agrees with tekst. */
    "undetermined": "nierozpoznany",
    "Guessed from the text.": "Rozpoznane na podstawie tekstu.",
    /* THE ENGINE'S OWN WORD for the same thing, from its Polish sentence "razem z tokenami"
       rather than from a table pair; Studio calling them anything else would make them look
       like a different feature. */
    "Placeholders": "Tokeny",
    /* In {USES} would need the locative, w 2 użyciach, which C() cannot make; the bare
       nominative after a comma reads as what it is, a count. Both rows, same reason. */
    "{TOKEN} becomes {TO}, in {USES}.": "{TOKEN} staje się {TO}, {USES}.",
    "{TOKEN} has no equivalent here, in {USES}.": "{TOKEN} nie ma tu odpowiednika, {USES}.",
    "Unmapped ones are left as plain text and flagged, never dropped.":
      "Tokeny bez odpowiednika zostają w tekście jako zwykłe słowa i są oznaczone; żaden nie znika.",
    /* Identyczne would have to agree with the count; bez różnic and blisko siebie do not
       inflect at all. The hyphen becomes a colon, which is the house style anyway. */
    "Duplicates - {SAME} the same, {CLOSE} close":
      "Duplikaty: {SAME} bez różnic, {CLOSE} blisko siebie",
    "This row": "Ten wiersz",
    "Looks like": "Podobny do",
    "How close": "Podobieństwo",
    "Do what": "Co dalej",
    "same": "bez różnic",
    /* Maxim ruled this cell stays a statement (468) and the Polish is written as one. */
    "Keep both": "Oba zostają",

    /* The wizard's third cover, what landed. */
    "Landed as a draft": "Zapisane jako szkic",
    "{CARDS}, {CATS}, {INTENTS}. Nothing is published, and no desk can see it yet.":
      "{CARDS}, {CATS}, {INTENTS}. Stanowiska zobaczą to dopiero po publikacji.",
    "What came in": "Co trafiło do katalogu",
    "What is left out": "Co zostało poza katalogiem",
    "{COLS} nothing claimed, so they were not imported.":
      "{COLS} bez przypisania, poza importem.",
    "{USES} of a platform placeholder this catalog has no field for.":
      "{USES} tokena platformy, dla którego ten katalog nie ma pola.",
    /* THE THIRD CHIP ON THE PANE THAT COUNTS THE LINT (board 544). Polish puts the language at
       the head and the count after the colon as a bare quantity, which is the second of the
       three shapes this file names for a counted line and the shape Claudette wrote the publish
       cover's awaiting sentence in: `C()`'s nominative is right at every number there, and a
       finite verb after it would not be - "3 karty czeka" is wrong where "31 kart czeka" is
       right, so this frame carries no verb at all. */
    "{CARDS} awaiting {LANG}": "{LANG} do uzupełnienia: {CARDS}",
    /* The count is dropped: Polish wants the genitive after pierwsze z and C() gives the
       nominative. It costs nothing, because {CARDS} is already at the head of this cover. */
    "The first of the {CARDS}, as they landed": "Pierwsze karty, tak jak zostały zapisane",
    "The draft lives in Studio only. It becomes an edition the desks can read when you publish it.":
      "Szkic istnieje tylko w Studiu. Stanowiska mogą go czytać dopiero po publikacji.",

    /* The wizard's counted nouns. */
    /* A cell and a repeat, for the cover that shows a column coming round in a cycle (642).
       Raz/razy takes the same word for the few and the many, which is correct and reads like an
       oversight, so the few form is written down with the rest rather than left out. */
    "{N} cell": "{N} komórka",
    "{N} cells": "{N} komórek",
    "{N} time": "{N} raz",
    "{N} times": "{N} razy",
    "{N} row": "{N} wiersz",
    "{N} rows": "{N} wierszy",
    "{N} column": "{N} kolumna",
    "{N} columns": "{N} kolumn",
    "{N} use": "{N} użycie",
    "{N} uses": "{N} użyć",
    "{N} category": "{N} kategoria",
    "{N} categories": "{N} kategorii",
    "{N} intent": "{N} intencja",
    "{N} intents": "{N} intencji",
    "{N} field": "{N} pole",
    "{N} fields": "{N} pól",
    "{N} name": "{N} nazwa",
    "{N} names": "{N} nazw",

    /* THE WIZARD'S FIRST STEP ASKS WHERE THE FILE LANDS (board 539, frame G). Przyjmowany
       and odrzucany rather than a past participle: the sentence is about what happens to
       every row, not about one row that has already been decided, and the imperfective
       agrees with wiersz without picking a sex for the reader. */
    "Where it lands": "Gdzie trafia",
    "Into this catalog": "Do tego katalogu",
    "As a new catalog": "Jako nowy katalog",
    "Nothing lands in the catalog. Every row arrives in Proposals, where it is accepted or rejected one at a time or all at once.":
      "Każdy wiersz trafia najpierw do Propozycji, a do katalogu dopiero po przyjęciu; wiersze"
      + " przyjmuje się pojedynczo albo wszystkie naraz.",
    "A new catalog of its own, beside the others. The open one is not touched.":
      "Osobny nowy katalog, obok pozostałych. Otwarty katalog zostaje bez zmian.",
    "Send it to Proposals": "Wyślij do Propozycji",

    /* The review queue's screen. */
    "A file an agent exported, dropped into this folder. Nothing is decided until you decide it.":
      "Plik, który agent wyeksportował i zostawił w tym folderze. O każdej zmianie decyduje się"
      + " tutaj.",
    "File": "Plik",
    "Changes": "Zmiany",
    "Waiting": "Czeka",
    "Nothing is waiting.": "Nic nie czeka.",
    /* The empty Proposals screen names the folder it watches (board 976). */
    "Watching": "Obserwowany folder",
    /* After a colon the phrase is a label rather than a predicate, so it agrees with nothing;
       the same device as the archive's `Dotąd w archiwum {REVISIONS}.` above. */
    /* Not Zmień, which the publish cover already uses as its imperative. */
    "What changes": "Co się zmienia",
    "Was": "Było",
    "Accept": "Przyjmij",
    "Reject": "Odrzuć",
    "decided in an earlier review": "rozstrzygnięte we wcześniejszym przeglądzie",
    "Check first": "Do sprawdzenia",
    "Whose proposal this is": "Czyja to propozycja",
    "This proposal asks for Etiuda {VERSION} or newer, and this Studio works with Etiuda {ENGINE}, so it may not show everything in it. Archiving keeps the proposal whole, and a newer Etiuda Studio shows all of it.":
      "Ta propozycja wymaga Etiudy w wersji {VERSION} lub nowszej, a to Studio współpracuje z Etiudą w wersji {ENGINE}, więc może nie pokazać wszystkiego, co w niej jest. Archiwizacja zachowa propozycję w całości, a nowsza wersja Etiudy Studio pokaże ją całą.",
    "This proposal holds things this Studio cannot show. Archiving keeps it whole.":
      "Ta propozycja zawiera coś, czego to Studio nie potrafi pokazać. Archiwizacja zachowa ją w całości.",
    "Archive anyway": "Zarchiwizuj mimo to",

    /* THE MARKER PEN (604). "Przeredagowane" is the neuter plural past participle the queue's
       four chips already use, so the column head agrees with nothing and reads the same over a
       count as over a blank; the two sentences on a marked passage are one statement and what
       a click does. */
    "Reworded": "Przeredagowane",
    "{LANG}: joined from separate passages": "{LANG}: złożony z osobnych fragmentów",
    "Check its ending: the text after it went unread":
      "Do sprawdzenia zakończenie: dalszej części pliku nie odczytano",
    "Check its opening: the text before it went unread":
      "Do sprawdzenia początek: wcześniejszej części pliku nie odczytano",
    "Reworded. Press to put the file's own words back.":
      "Przeredagowane. Kliknięcie przywraca słowa z pliku.",
    "The file's own words. Press to put the proposal's back.":
      "Słowa z pliku. Kliknięcie przywraca propozycję.",

    /* THE PANEL AND THE LIST (604, variant F). The panel's head is a statement about the file
       and not a label on a thing, so Polish takes the past tense and the neuter "było", which
       agrees with a passage of any gender and of any length; "plik" and "propozycja" are the
       list's two row heads and are nouns in the nominative, which is what a head behind a colon
       needs and what the sheet uppercases. The two buttons are imperatives in both languages,
       the shape every other control on this screen already has. */
    "The file said": "W pliku było",
    "The proposal said": "W propozycji było",
    "Put it back": "Przywróć",
    "Use the proposal's words": "Użyj słów z propozycji",
    "What was changed": "Co zostało zmienione",
    "the file": "plik",
    "proposed": "propozycja",

    /* THE QUEUE AS CLAUDIA DREW IT (board 539: the rows frame E, the two doors frame F).
       THE FOUR CHIPS ARE PAST PARTICIPLES IN BOTH LANGUAGES and neuter plural in Polish, so
       each agrees with nothing and reads the same over a card, a tag and a catalog field.
       The English is Added/Changed rather than the frame's New/Change because `Change` is
       already a key of this table and already means Zmień, the publish cover's imperative:
       one English word cannot be an imperative on one screen and a noun on another. */
    "Added": "Dodane",
    "Changed": "Zmienione",
    "Moved": "Przeniesione",
    "Removed": "Usunięte",
    "The catalog itself": "Sam katalog",
    "Was, and what it becomes": "Było i będzie",
    /* The head pane's four facts. */
    "Its edition": "Wydanie",
    "Where it came from": "Skąd pochodzi",
    "another catalog, {ID}": "inny katalog, {ID}",
    "imported from {FILE}": "import z pliku {FILE}",
    /* Claudette's words, 2026-11-02, board 956. Beside the file's own line, not in its place. */
    "imported from pasted text": "import z wklejonego tekstu",
    /* THE IMPORT'S OWN NOTES ON THE WIZARD'S COVERS (sense pass 2026-09-22, item 21), and the
       three field words the selects showed as format keys. This seat's Polish, written as
       Polish; the copywriter read it and rewrote three of the notes (board 744). */
    "Identifier": "Identyfikator",
    "Note": "Notatka",
    "More than one column is headed {NAME}, and only the last of them was read. Once each has a name of its own in the file, a second import reads them all.":
      "Więcej niż jedna kolumna ma nagłówek {NAME}, a wczytano tylko ostatnią z nich. Gdy każda dostanie w pliku własną nazwę, ponowny import wczyta je wszystkie.",
    "The column {NAME} stays out of the import, as Studio could not tell which field it belongs to. If it holds catalog content, the screen \"What is in this file\" offers a field for it on its row. If not, nothing needs doing.":
      "Kolumna {NAME} zostaje pominięta, bo Studio nie rozpoznało, do którego pola należy. Jeśli jest w niej treść katalogu, na ekranie \"Co jest w tym pliku\", w wierszu tej kolumny, można wybrać dla niej pole. Jeśli nie, nic nie trzeba robić.",
    "the column {NAME} is headed {CODE} and reads as {READS}; the header was kept, so either the heading or the content is wrong and only a person can say which":
      "nagłówek kolumny {NAME} wskazuje język {CODE}, ale tekst w niej odczytano jako {READS};"
      + " nagłówek zostaje, więc błędny jest albo on, albo treść, i rozstrzygnąć może tylko"
      + " człowiek",
    "rows with no {CODE} text in {NAME}: {MISSING} of {TOTAL}; the engine refuses a card with no text in a language the catalog declares, so those cards will fail the checks until they are filled or {CODE} is dropped":
      "wiersze bez tekstu w języku {CODE} w kolumnie {NAME}: {MISSING} z {TOTAL}; Etiuda nie przyjmuje karty bez tekstu w języku, który katalog deklaruje, więc te karty nie przejdą kontroli, dopóki nie zostaną uzupełnione albo język {CODE} nie zostanie usunięty z katalogu",
    /* Boards 779 and 780: import wizard notes (Claudette, section W-import). Reworded for boards 784 and 785. */
    "The column {COLUMN} went under \"{FIELD}\" because of the headings beside it; its text alone could not confirm that. If the language is right, nothing needs doing. If not, the screen \"What is in this file\" offers the right one on this column's row, or \"Do not import\".":
      "Kolumna {COLUMN} trafiła do pola \"{FIELD}\" na podstawie sąsiednich nagłówków, choć po samym tekście nie da się tego potwierdzić. Jeśli język się zgadza, nic nie trzeba robić. Jeśli nie, na ekranie \"Co jest w tym pliku\", w wierszu tej kolumny, można wybrać właściwy język albo \"Nie importuj\".",
    "The columns {COLUMNS} went under the same field, \"{FIELD}\", which holds only one; for now, {FIRST} is the one read. On the screen \"What is in this file\", each can be given a field of its own on its row, or left out with \"Do not import\".":
      "Kolumny {COLUMNS} trafiły do tego samego pola, \"{FIELD}\", a jedno pole mieści tylko jedną kolumnę; na razie wczytywana jest kolumna {FIRST}. Na ekranie \"Co jest w tym pliku\", w wierszu każdej z nich, można wybrać osobne pole albo \"Nie importuj\".",
    /* Board 783: cycling file notes (Claudette, section W-import). Rewritten for board 784. */
    "The file's one column repeats the same pattern, so each repeat became one row of a table, {ROWS} in all. The pattern is very clear.":
      "W jedynej kolumnie pliku powtarza się ten sam wzór, więc każde powtórzenie stało się osobnym wierszem tabeli. W sumie: {ROWS}. Wzór jest bardzo wyraźny.",
    "The file's one column repeats the same pattern, so each repeat became one row of a table, {ROWS} in all. The pattern is clear, if looser in places, so it is worth a glance to see that each row holds what belongs together.":
      "W jedynej kolumnie pliku powtarza się ten sam wzór, więc każde powtórzenie stało się osobnym wierszem tabeli. W sumie: {ROWS}. Wzór jest wyraźny, choć miejscami luźniejszy, więc warto rzucić okiem, czy w każdym wierszu jest to, co do siebie należy.",
    "The file's one column repeats the same pattern, so each repeat became one row of a table, {ROWS} in all. The pattern is a subtle one, so it is worth checking carefully that each row holds what belongs together. A sheet with a heading over each column is read as it stands.":
      "W jedynej kolumnie pliku powtarza się ten sam wzór, więc każde powtórzenie stało się osobnym wierszem tabeli. W sumie: {ROWS}. Wzór jest dość subtelny, więc warto uważnie sprawdzić, czy w każdym wierszu jest to, co do siebie należy. Arkusz, w którym każda kolumna ma nagłówek, Studio odczyta wprost.",
    /* Boards 784 and 785: seven older import wizard notes (Claudette, section W-import). */
    "The file has commas in it, but not the same number on every line, so Studio read it as one column rather than as a table. Nothing after a comma was lost.":
      "W pliku są przecinki, ale nie w każdej linijce jest ich tyle samo, więc Studio odczytało go jako jedną kolumnę, a nie jako tabelę. Nic, co stało po przecinku, nie przepadło.",
    "The file's rows all have the same number of fields, but the first row gives no name to a column that holds content, so Studio read the file as one column rather than as a table. Nothing in it was lost. Once every column that holds content has a name in the first row, Studio reads the file as a table.":
      "Wiersze pliku mają po tyle samo pól, ale w pierwszym z nich brakuje nazwy nad kolumną, w której jest treść, więc Studio odczytało plik jako jedną kolumnę, a nie jako tabelę. Nic z pliku nie przepadło. Gdy każda kolumna z treścią będzie miała nazwę w pierwszym wierszu, Studio odczyta plik jako tabelę.",
    "Some rows have more fields than the heading row, and fields with no heading were not imported: {FIELDS} left out, from {ROWS}.":
      "Część wierszy ma więcej pól niż wiersz nagłówków, a pól bez nagłówka nie zaimportowano. Dotyczy to: {ROWS}. Pominięto: {FIELDS}.",
    "Some fields sit under a heading with no name, so they were not imported: {FIELDS}. A name added in the file, and a second import, brings them in.":
      "Nad częścią pól w wierszu nagłówków nie ma nazwy, więc tych pól nie zaimportowano. Pominięto: {FIELDS}. Wystarczy dopisać nazwę w pliku i zaimportować go ponownie.",
    "Some names appear more than once in the heading row, and of the columns sharing a name only the last was read: {NAMES} repeated, {FIELDS} left out.":
      "Niektóre nazwy powtarzają się w wierszu nagłówków, a spośród kolumn o tej samej nazwie wczytano tylko ostatnią. Dotyczy to: {NAMES}. Pominięto: {FIELDS}.",
    "The last repeat is shorter than the others, as in an export that ends where its content ends, so the last row's missing fields were left empty.":
      "Ostatnie powtórzenie jest krótsze od pozostałych, jak w eksporcie, który kończy się razem z treścią, więc w ostatnim wierszu brakujące pola zostały puste.",
    "The column opens with something that belongs to no repeat, a heading or a title perhaps, so it was left out of the table: {CELLS}.":
      "Na początku kolumny jest coś, co nie należy do żadnego powtórzenia, na przykład nagłówek albo tytuł, więc nie trafiło do tabeli. Pominięto: {CELLS}.",
    "{A} and {B}":
      "{A} i {B}",
    "{HEAD} and {LAST}":
      "{HEAD} i {LAST}",
    "Text (English)":
      "Treść (angielski)",
    "Text (Polish)":
      "Treść (polski)",
    "Title (English)":
      "Tytuł (angielski)",
    "Title (Polish)":
      "Tytuł (polski)",
    "Note (English)":
      "Notatka (angielski)",
    "Note (Polish)":
      "Notatka (polski)",
    "Categories (English)":
      "Kategorie (angielski)",
    "Categories (Polish)":
      "Kategorie (polski)",
    "Intents (English)":
      "Intencje (angielski)",
    "Intents (Polish)":
      "Intencje (polski)",
    "Who (English)":
      "Kto (angielski)",
    "Who (Polish)":
      "Kto (polski)",
    "Identifier (English)":
      "Identyfikator (angielski)",
    "Identifier (Polish)":
      "Identyfikator (polski)",
    "Keywords (English)":
      "Słowa kluczowe (angielski)",
    "Keywords (Polish)":
      "Słowa kluczowe (polski)",
    "{HEAD} ({LANG})":
      "{HEAD} ({LANG})",
    "ask a model to find the cards in the text":
      "poproś model o znalezienie kart w tekście",
    "every sheet in this workbook is empty":
      "wszystkie arkusze w tym skoroszycie są puste",
    "sheets with content in this workbook: {N}. Only \"{SHEET}\" was read; import the others separately":
      "arkusze z zawartością w tym skoroszycie: {N}. Odczytano tylko \u201E{SHEET}\u201D; pozostałe należy zaimportować osobno",
    "not read on a sheet: {WHAT} (parts: {N}). Such content cannot become cards":
      "nie odczytano z arkusza: {WHAT} (części: {N}). Z takiej zawartości nie da się utworzyć kart",
    "a drawing or a floating image":
      "rysunek lub obraz pływający",
    "a chart":
      "wykres",
    "an embedded picture":
      "osadzony obraz",
    "a cell comment":
      "komentarz do komórki",
    "a threaded comment":
      "komentarz w wątku",
    "a pivot table":
      "tabela przestawna",
    "an embedded object":
      "osadzony obiekt",
    "the cell {REF} is formatted as a date and was read as the number the file holds, not converted, because a workbook counts its dates from a starting day of its own":
      "komórka {REF} ma format daty i odczytano ją jako liczbę zapisaną w pliku, bez przeliczania, bo skoroszyt liczy daty od własnego dnia początkowego",
    "the cell {REF} holds a formula and no saved result, so it was read as empty. Open the workbook, let it calculate, save it and import again":
      "komórka {REF} zawiera formułę bez zapisanego wyniku, więc odczytano ją jako pustą. Należy otworzyć skoroszyt, poczekać na przeliczenie, zapisać go i zaimportować ponownie",
    "the cell {REF} holds a spreadsheet error and was read as that error's own text":
      "komórka {REF} zawiera błąd arkusza i odczytano ją jako tekst tego błędu",
    "the cell {REF} points at text this workbook does not hold":
      "komórka {REF} wskazuje tekst, którego ten skoroszyt nie zawiera",
    "merged regions on the sheet: {N}. The value of each is in its top-left cell and the rest of the region is empty in the file, so a merged heading reads as one cell and blanks":
      "scalone obszary w arkuszu: {N}. Wartość każdego jest w jego lewej górnej komórce, a reszta obszaru jest w pliku pusta, więc scalony nagłówek zostanie odczytany jako jedna komórka i puste pola",
    "the sheet has no cell with anything in it":
      "w arkuszu nie ma żadnej komórki z zawartością",
    "hidden rows read on the sheet \"{SHEET}\": {N}. They are in the import":
      "ukryte wiersze odczytane z arkusza \u201E{SHEET}\u201D: {N}. Są w imporcie",
    "the sheet \"{SHEET}\" is hidden, and no visible sheet has anything in its cells, so the import is this sheet's cells":
      "arkusz \u201E{SHEET}\u201D jest ukryty, a w komórkach żadnego widocznego arkusza nic nie ma, więc import pochodzi z komórek tego arkusza",
    "the cell {REF} shows \"{SHOWN}\" and was read as that text, not as the stored number \"{STORED}\"":
      "komórka {REF} pokazuje \u201E{SHOWN}\u201D i odczytano ją jako ten tekst, a nie jako zapisaną liczbę \u201E{STORED}\u201D",
    "the cell {REF} has a number format this import cannot show, so the stored number \"{STORED}\" was kept":
      "komórka {REF} ma format liczby, którego ten import nie odtwarza, więc zachowano zapisaną liczbę \u201E{STORED}\u201D",
    /* Placeholders, polish 04 item 9: the import's notes and the lint's lines as frames
       (src/lint-said.mjs). The copywriter's to replace. */
    "the file is not valid UTF-8 and was read as {ENC}; byte sequences a UTF-8 reader would have replaced: {N}. Check the letters of any card that looked wrong before this catalog goes out":
      "plik nie jest poprawnym UTF-8 i odczytano go jako {ENC}; sekwencje bajtów, które czytnik UTF-8 by zastąpił: {N}. Przed wysłaniem katalogu należy sprawdzić litery w kartach, które wyglądały źle",
    "{A}, {B}":
      "{A}, {B}",
    "\"{FROM}\" as \"{TO}\"":
      "\u201E{FROM}\u201D jako \u201E{TO}\u201D",
    ", and the rest: {M}":
      ", pozostałe: {M}",
    " {S}":
      " {S}",
    "with no language named":
      "bez wskazanego języka",
    "the column override names a column the file does not have: \"{H}\"":
      "ręczne przypisanie wskazuje kolumnę, której nie ma w pliku: \u201E{H}\u201D",
    "the column override sends \"{H}\" to \"{F}\", which is no field":
      "ręczne przypisanie kieruje kolumnę \u201E{H}\u201D do pola \u201E{F}\u201D, które nie istnieje",
    "the column override sends \"{H}\" to {F}, which takes one value per language: write {F}.en or {F}.pl":
      "ręczne przypisanie kieruje kolumnę \u201E{H}\u201D do pola {F}, które ma osobną wartość dla każdego języka: należy wpisać {F}.en albo {F}.pl",
    "columns claiming {F}: {N} ({LIST}). Name one in the override table":
      "kolumny przypisane do pola {F}: {N} ({LIST}). Należy wskazać jedną w tabeli przypisań",
    "columns claiming {F}{LANGPART}: {N}. Name one in the override table":
      "kolumny przypisane do pola {F}{LANGPART}: {N}. Należy wskazać jedną w tabeli przypisań",
    "labels renamed by categories.csv beside the file: {N}. {LIST}{MORE}":
      "etykiety zmienione przez plik categories.csv obok pliku: {N}. {LIST}{MORE}",
    "category keys declared in categories.csv that no row uses, so no category was made for them: {N} ({LIST}). An empty category is the first thing a customer sees go wrong":
      "klucze kategorii zadeklarowane w categories.csv, których nie używa żaden wiersz, więc nie powstała dla nich kategoria: {N} ({LIST}). Pusta kategoria to pierwszy błąd, który widzi klient",
    "intent clauses declared in intents.csv that no row names: {N} ({LIST}{MORE})":
      "frazy intencji zadeklarowane w intents.csv, których nie wskazuje żaden wiersz: {N} ({LIST}{MORE})",
    "cards with search keywords: {K} of {C}. Keywords in all: {W}; found nowhere in the card's own title, body, note or category label: {O}. Only those add anything: every other keyword repeats a word the card already says, and the card is found without it. The keywords found only there are content, and content belongs in the card's text.":
      "karty ze słowami kluczowymi: {K} z {C}. Słowa kluczowe łącznie: {W}; niewystępujące w tytule, treści, notatce ani nazwie kategorii karty: {O}. Tylko one coś dodają: każde inne słowo kluczowe powtarza słowo, które karta już zawiera, i karta znajduje się bez niego. Słowa kluczowe, które są tylko tam, to treść, a treść powinna być w tekście karty.",
    "cards with search keywords: {K} of {C}. Keywords in all: {W}; found nowhere in the card's own title, body, note or category label: {O}. Only those add anything: every other keyword repeats a word the card already says, and the card is found without it. Cards whose keywords only repeat the card, and could be emptied with nothing lost: {R}. The keywords found only there are content, and content belongs in the card's text.":
      "karty ze słowami kluczowymi: {K} z {C}. Słowa kluczowe łącznie: {W}; niewystępujące w tytule, treści, notatce ani nazwie kategorii karty: {O}. Tylko one coś dodają: każde inne słowo kluczowe powtarza słowo, które karta już zawiera, i karta znajduje się bez niego. Karty, których słowa kluczowe tylko powtarzają kartę i można je usunąć bez straty: {R}. Słowa kluczowe, które są tylko tam, to treść, a treść powinna być w tekście karty.",
    "this draft is waiting for its {LANG} text: the catalog declares {LANGS}, and cards lacking {LANG}: {N} of {TOTAL}. A language beyond the first is optional, so the import stands as it is and the gap is shown here once rather than on every card. It publishes as it stands, and what is still missing is counted on the publish cover and in the release notes.":
      "ten szkic czeka na tekst w języku {LANG}: katalog deklaruje {LANGS}, a karty bez języka {LANG}: {N} z {TOTAL}. Język inny niż pierwszy jest opcjonalny, więc import zostaje taki, jaki jest, a brak widać tu raz, a nie przy każdej karcie. Katalog publikuje się w tej postaci, a to, czego jeszcze brakuje, jest podane na ekranie publikacji i w informacjach o wydaniu.",
    "this draft is waiting for its {LANG} text: the catalog declares {LANGS}, and the engine says \"{SAYS}\". A language beyond the first is optional, so the import stands as it is and the gap is shown here once rather than on every card. It publishes as it stands, and what is still missing is counted on the publish cover and in the release notes.":
      "ten szkic czeka na tekst w języku {LANG}: katalog deklaruje {LANGS}, a silnik podaje: \u201E{SAYS}\u201D. Język inny niż pierwszy jest opcjonalny, więc import zostaje taki, jaki jest, a brak widać tu raz, a nie przy każdej karcie. Katalog publikuje się w tej postaci, a to, czego jeszcze brakuje, jest podane na ekranie publikacji i w informacjach o wydaniu.",
    "the engine reports a language awaiting text under a name this draft does not declare: {LINE}":
      "silnik zgłasza język oczekujący na tekst pod nazwą, której ten szkic nie deklaruje: {LINE}",
    "the engine could not be asked which of its findings the absence of {LANG} causes, because the test catalog added findings of its own: {N} (the first: {FIRST}). So all of them stand as errors":
      "nie dało się ustalić, które ustalenia silnika wynikają z braku języka {LANG}, bo katalog testowy dodał własne: {N} (pierwsze: {FIRST}). Dlatego wszystkie pozostają błędami",
    "the file is not valid UTF-8 and was read as {ENC}; byte offsets a UTF-8 reader would have replaced: {LIST}. Check the letters of any card that looked wrong before this catalog goes out":
      "plik nie jest poprawnym UTF-8 i odczytano go jako {ENC}; pozycje bajtów, które czytnik UTF-8 by zastąpił: {LIST}. Przed wysłaniem katalogu należy sprawdzić litery w kartach, które wyglądały źle",
    "joins proposed by the joining pass and refused, because their pieces are not one unbroken stretch of the file: {N}. Those cards are in the queue as the first pass proposed them":
      "połączenia zaproponowane podczas łączenia i odrzucone, bo ich części nie tworzą jednego ciągłego fragmentu pliku: {N}. Te karty są w kolejce w postaci z pierwszego przebiegu",
    "a card came back with no title and was given its own first line; proposal {I}":
      "karta wróciła bez tytułu, więc jej tytułem został jej pierwszy wiersz; propozycja {I}",
    "a proposal was refused before it reached the queue: {WHY}{LANGPART}{SPAN}":
      "propozycję odrzucono, zanim trafiła do kolejki: {WHY}{LANGPART}{SPAN}",
    ", span {AT}":
      ", fragment {AT}",
    "it points at no part of the file":
      "nie wskazuje żadnego fragmentu pliku",
    "its text is not in the file":
      "jej tekstu nie ma w pliku",
    "one of its parts is empty":
      "jeden z jej fragmentów jest pusty",
    "it reworded the text, which was not asked for":
      "przeredagowała tekst, o co nie proszono",
    "it has no text":
      "nie ma tekstu",
    "it has no reply text":
      "nie ma treści odpowiedzi",
    "a reply text has no language code":
      "treść odpowiedzi nie ma kodu języka",
    "proposed bodies made of spans that are each in the file but not as one piece, so they join text from more than one place: {N}. The score counts such a body as invented, and a reader should look at them":
      "proponowane treści złożone z fragmentów, z których każdy jest w pliku, ale nie w jednym kawałku, więc łączą tekst z różnych miejsc: {N}. Wynik liczy taką treść jako wymyśloną i należy się im przyjrzeć",
    "two category keys slug to one id; {KEY} was given {ID} so that {TAKEN} stays with the first":
      "dwa klucze kategorii dają ten sam identyfikator; {KEY} dostał {ID}, żeby {TAKEN} został przy pierwszym",
    "cards are filed under the category key {KEY}, which categories.csv does not declare; the shelf was minted and labelled with the key itself, so it will read as {KEY} on the pill until somebody names it":
      "karty są przypisane do klucza kategorii {KEY}, którego categories.csv nie deklaruje; kategorię utworzono z samym kluczem jako nazwą, więc na przycisku będzie widać {KEY}, dopóki ktoś jej nie nazwie",
    "row {ROW} claims the id {TAKEN}, which is taken; it was given {ID} so the file still loads, but two rows asking for one identity is a merge somebody has to make":
      "wiersz {ROW} ma identyfikator {TAKEN}, który jest już zajęty; dostał {ID}, żeby plik dało się wczytać, ale dwa wiersze o jednej tożsamości ktoś musi połączyć",
    "rows whose id is not 3 to 64 of a-z, 0-9 and the hyphen, each given a new one under which every desk files that card from now on: {N}. The first of them: {FIRST}":
      "wiersze z identyfikatorem spoza 3 do 64 znaków a-z, 0-9 i łącznika, z nowym identyfikatorem, pod którym każde stanowisko będzie odtąd trzymać tę kartę: {N}. Pierwsze z nich: {FIRST}",
    "cards {TWIN} and {OF} share one title in one category, once letter case, accents and punctuation are set aside; the import keeps both as cards of their own, and at the desk they look alike until one is given another title or the two become one card":
      "karty {TWIN} i {OF} mają w jednej kategorii ten sam tytuł, jeśli nie liczyć wielkości liter, znaków diakrytycznych i interpunkcji; import zachowuje obie jako osobne karty, a na stanowisku będą łudząco podobne, dopóki jedna nie dostanie innego tytułu albo obie nie staną się jedną kartą",
    "card {TWIN} carries the same text as {OF}, once letter case, accents and punctuation are set aside; the import keeps both as cards of their own, and if they are one answer, one card is enough, and if two, each can have words of its own":
      "karta {TWIN} ma ten sam tekst co {OF}, jeśli nie liczyć wielkości liter, znaków diakrytycznych i interpunkcji; import zachowuje obie jako osobne karty. Jeśli to jedna odpowiedź, wystarczy jedna karta, a jeśli dwie, każda może mieć własne słowa",
    "near duplicate: {TWIN} and {OF} score title {TITLE}, body {BODY} against thresholds {T1} and {T2} ({ON})":
      "prawie duplikat: {TWIN} i {OF}, tytuł {TITLE}, treść {BODY}, przy progach {T1} i {T2} ({ON})",
    "the platform placeholder {TOKEN} has no engine equivalent and was left in the text exactly as it stands, {USES}; a card carrying it shows it to the customer":
      "token platformy {TOKEN} nie ma odpowiednika w Etiudzie i został w tekście bez zmian, {USES}; karta, która go zawiera, pokaże go klientowi",
    "Etiuda's checks: {LINE}":
      "kontrola Etiudy: {LINE}",
    "card {ID}: no title in {LANG}, the primary language":
      "karta {ID}: brak tytułu w języku głównym, {LANG}",
    "card {ID}: no body in {LANG}, the primary language":
      "karta {ID}: brak treści w języku głównym, {LANG}",
    "card {ID}: shelf absent":
      "karta {ID}: brak kategorii",
    "card {ID}: shelf {SHELF} names no tag":
      "karta {ID}: kategoria {SHELF} nie istnieje",
    "card {ID}: shelf {SHELF} is a {KIND}":
      "karta {ID}: {SHELF} nie jest kategorią ({KIND})",
    "card {ID}: requests names {TAG}, which is no tag":
      "karta {ID}: intencja {TAG} nie istnieje",
    "card {ID}: requests names {TAG}, a {KIND}":
      "karta {ID}: {TAG} nie jest intencją ({KIND})",
    "card {ID}: the id is claimed twice":
      "karta {ID}: ten identyfikator występuje dwa razy",
    "card {ID}: bodyShape absent":
      "karta {ID}: brak kształtu treści",
    "card {ID}: bodyShape \"{SHAPE}\" is not plain, steps or alts":
      "karta {ID}: kształt treści \"{SHAPE}\" nie jest żadnym z trzech: plain, steps, alts",
    "card {ID} ({LANG}): {LINE} is a line in brackets that is not a marker":
      "karta {ID} ({LANG}): {LINE} to wiersz w nawiasach, który nie jest znacznikiem",
    "card {ID} ({LANG}): {LINE} labels a step, and only an alternative takes a label":
      "karta {ID} ({LANG}): {LINE} nadaje etykietę krokowi, a etykietę może mieć tylko wariant",
    "card {ID} ({LANG}): bodyShape is plain and the body carries {N} marker(s)":
      "karta {ID} ({LANG}): treść ma kształt zwykły, a zawiera znaczniki: {N}",
    "card {ID} ({LANG}): bodyShape is {SHAPE} and the body does not open with a marker":
      "karta {ID} ({LANG}): treść ma kształt {SHAPE}, a nie zaczyna się od znacznika",
    "card {ID} ({LANG}): bodyShape is {SHAPE} and the body opens with {FIRST}":
      "karta {ID} ({LANG}): treść ma kształt {SHAPE}, a zaczyna się od {FIRST}",
    "card {ID} ({LANG}): {N} block(s) against {M} in {PRIMARY}":
      "karta {ID} ({LANG}): bloki: {N}, a w języku {PRIMARY}: {M}",
    "card {ID} ({LANG}): {TOKEN} is not a variable the desk fills; the desk fills {NEAR}":
      "karta {ID} ({LANG}): {TOKEN} nie jest zmienną, którą stanowisko wypełnia; wypełnia {NEAR}",
    "card {ID} ({LANG}): {TOKEN} is not a variable the desk fills, so the customer would read it as written":
      "karta {ID} ({LANG}): {TOKEN} nie jest zmienną, którą stanowisko wypełnia, więc klient przeczyta go dosłownie",
    "tag {ID}: the id is claimed twice":
      "{ID}: ten identyfikator występuje dwa razy",
    "tag {ID}: no clause in {LANG}, the primary language":
      "{ID}: brak intencji w języku głównym, {LANG}",
    "intent {N} (\"{CLAUSE}\") has no {CODE} clause - invisible in {MODE} mode":
      "intencja {N} (\"{CLAUSE}\") nie ma brzmienia w języku {CODE}, więc w trybie {MODE} jej nie widać",
    "intent {N} points at unknown category \"{KEY}\"":
      "intencja {N} wskazuje nieznaną kategorię \"{KEY}\"",
    "\"fav\" is a reserved category key (virtual Favourites)":
      "\"fav\" to zastrzeżony klucz kategorii (wirtualne Ulubione)",
    "{MAP} covers {HAVE} of {ALL} categories; the rest fall back to {CODE}: {KEYS}":
      "{MAP} obejmuje {HAVE} z {ALL} kategorii; pozostałe mają nazwę w języku {CODE}: {KEYS}",
    "who: duplicate entry \"{ENTRY}\"":
      "rola \"{ENTRY}\" występuje dwa razy",
    "{WHO} token in {N} place(s) - the engine no longer resolves it, rename to {ROLE}: {LIST}":
      "token {WHO}, miejsca: {N}; Etiuda już go nie wypełnia, zamiast niego jest {ROLE}: {LIST}",
    "no categories declared":
      "katalog nie ma żadnej kategorii",
    "no cards":
      "katalog nie ma żadnej karty",
    /* THE SIXTEEN LINES OF THE FORMAT REVISION (board 834), as frames in src/lint-said.mjs, in Claudette's Polish
       (copy-c07-c09-2026-10-02.md, 2026-10-02); the field names (next, notes, grew.id) are left as written. `{STATE}` is the
       reader's own word, absent or malformed, and the page puts it through the two pairs below before the frame is filled. */
    "absent": "brak",
    "malformed": "błędna wartość",
    "card {ID}: {FLAG} is {VALUE}, wanted true or absent":
      "karta {ID}: {FLAG} ma wartość {VALUE}, a może mieć tylko true albo nie występować wcale",
    "card {ID}: next is not a list":
      "karta {ID}: pole next nie jest listą",
    "card {ID}: next[{I}] is not an entry with a to":
      "karta {ID}: next[{I}] nie jest wpisem z polem to",
    "card {ID}: next[{I}] names the card itself":
      "karta {ID}: next[{I}] wskazuje tę samą kartę",
    "card {ID}: next[{I}] names {TO}, which is no card":
      "karta {ID}: next[{I}] wskazuje {TO}, a takiej karty nie ma",
    "card {ID}: next[{I}] names {TO} a second time":
      "karta {ID}: next[{I}] wskazuje {TO} po raz drugi",
    "notes: not a table of text by language":
      "notes: to nie jest tabela tekstów według języków",
    "notes.{CODE}: a language this catalog does not declare":
      "notes.{CODE}: katalog nie deklaruje takiego języka",
    "notes.{CODE}: not text":
      "notes.{CODE}: to nie jest tekst",
    "{FIELD}: not an entry":
      "{FIELD}: to nie jest wpis",
    "grew.id: {STATE}, wanted the id of the catalog it grew from":
      "grew.id: {STATE}; ma tu być identyfikator katalogu, z którego wyrósł ten katalog",
    "grew.rev: {STATE}, wanted the rev it grew from":
      "grew.rev: {STATE}; ma tu być numer wersji, z której wyrósł ten katalog",
    "grew.sha: {STATE}, wanted sha256: and 64 lower-case hex characters":
      "grew.sha: {STATE}; poprawny zapis to sha256: i 64 małe znaki szesnastkowe",
    "desk.id: {STATE}, wanted k- and 16 lower-case hex characters":
      "desk.id: {STATE}; poprawny zapis to k- i 16 małych znaków szesnastkowych",
    "desk.name: not text":
      "desk.name: to nie jest tekst",
    "desk.{PART}: {STATE}, wanted 64 lower-case hex characters":
      "desk.{PART}: {STATE}; poprawny zapis to 64 małe znaki szesnastkowe",
    "facts: {N} line(s) over 100 chars - the panel is white-space:pre and will scroll sideways":
      "szybkie fakty: wiersze dłuższe niż 100 znaków: {N}; panel przewinie się w bok",
    "same title as card {N} in this category, so at the desk the two are hard to tell apart; one needs a title of its own, or the two can become one card":
      "ten sam tytuł ma karta {N} z tej kategorii, więc na stanowisku trudno je od siebie odróżnić; wystarczy zmienić tytuł jednej z nich albo połączyć obie w jedną kartę",
    "Polish body puts a bare \"{WORDS}\" in front of {INTENT}. The clause is in the instrumental, so the preposition is the {Z} token, which alternates z and ze by what follows it":
      "treść polska ma samo \"{WORDS}\" przed {INTENT}. Intencja stoi w narzędniku, więc przyimkiem jest token {Z}, który sam wybiera z albo ze według tego, co następuje",
    /* Waiting for the pin move past the desk's Words half (row 817); Claude alpha's ruling of 2026-11-08. */
    "{TOKEN} in the {CODE} body is not a token the desk fills, so it is copied as written":
      "{TOKEN} w treści {CODE} nie jest tokenem, który stanowisko wypełnia, więc zostaje skopiowany dosłownie",
    "card {N} (\"{TITLE}\"): {WHAT}":
      "karta {N} (\"{TITLE}\"): {WHAT}",
    "card {N}: {WHAT}":
      "karta {N}: {WHAT}",
    "roles.always names a category that does not exist: \"{K}\"":
      "roles.always wskazuje kategorię, która nie istnieje: \u201E{K}\u201D",
    "roles.opener names a category that does not exist: \"{K}\"":
      "roles.opener wskazuje kategorię, która nie istnieje: \u201E{K}\u201D",
    "{NAME} names a category that does not exist: \"{K}\"":
      "{NAME} wskazuje kategorię, która nie istnieje: \u201E{K}\u201D",
    "{NAME}[\"{K}\"] is empty - drop the key instead":
      "{NAME}[\u201E{K}\u201D] jest puste: lepiej usunąć ten klucz",
    "title ({KEY}) is required":
      "tytuł ({KEY}) jest wymagany",
    "{LANG} ({KEY}) is required":
      "język {LANG} ({KEY}) jest wymagany",
    "unknown category \"{C}\"":
      "nieznana kategoria \u201E{C}\u201D",
    "intent link {X} is out of range (0..{MAX})":
      "powiązanie z intencją {X} jest poza zakresem (0..{MAX})",
    "intent link \"{X}\" is not numeric - fine locally, fragile in a distributed file":
      "powiązanie z intencją \u201E{X}\u201D nie jest liczbą; działa lokalnie, ale może zawieść w przekazanym pliku",
    "intent link {X} is out of range":
      "powiązanie z intencją {X} jest poza zakresem",
    "seq without alt does nothing (blocks only split when alt is set)":
      "seq bez alt niczego nie zmienia (bloki dzielą się tylko przy ustawionym alt)",
    "{BASE} {PRIMARY} blocks vs {N} {LANG} blocks - copies at the same index will diverge":
      "bloki {PRIMARY}: {BASE}, a bloki {LANG}: {N}; kopie pod tymi samymi indeksami się rozejdą",
    "intents.{K} length {A} != intents.{PRIMARY} length {N} (engine pads, but alignment is positional - check for a slipped row)":
      "intents.{K} ma długość {A} != intents.{PRIMARY} ma długość {N} (silnik uzupełnia, ale wyrównanie jest pozycyjne - sprawdź przesunięty wiersz)",
    "the {LANG} category names":
      "nazwy kategorii w języku {LANG}",
    "\"fav\" is a key kept for Favourites, so it cannot name a category":
      "\u201Efav\u201D to klucz zarezerwowany dla Ulubionych, więc nie może oznaczać kategorii",
    "{NAME} gives the category \"{K}\" no text: remove that key instead":
      "{NAME} nie podaje żadnego tekstu dla kategorii \u201E{K}\u201D: lepiej usunąć ten klucz",
    "the categories always shown name one that does not exist: \"{K}\"":
      "wśród kategorii wyświetlanych zawsze jest taka, która nie istnieje: \u201E{K}\u201D",
    "the opening category names one that does not exist: \"{K}\"":
      "kategoria otwierająca wskazuje kategorię, która nie istnieje: \u201E{K}\u201D",
    "the title ({KEY}) is required":
      "tytuł ({KEY}) jest wymagany",
    "the {LANG} text ({KEY}) is required":
      "treść w języku {LANG} ({KEY}) jest wymagana",
    "unknown category: \"{C}\"":
      "nieznana kategoria: \u201E{C}\u201D",
    "the intent link {X} is out of range: the intents run from 0 to {MAX}":
      "powiązanie z intencją {X} jest poza zakresem: intencje mają numery od 0 do {MAX}",
    "the intent link \"{X}\" is not a number. It works on this computer but can break in a file passed to others":
      "powiązanie z intencją \u201E{X}\u201D nie jest liczbą. Działa na tym komputerze, ale w pliku przekazanym innym może przestać działać",
    "the intent link {X} is out of range":
      "powiązanie z intencją {X} jest poza zakresem",
    "Steps without Alternatives do nothing: the blocks split only when the card has Alternatives":
      "Kroki bez Wariantów niczego nie zmieniają: bloki dzielą się tylko wtedy, gdy karta ma Warianty",
    "the {PRIMARY} text has blocks: {BASE}, and the {LANG} text: {N}. Copies at the same place will not match":
      "bloki w treści w języku {PRIMARY}: {BASE}, a w języku {LANG}: {N}. Kopie na tych samych miejscach nie będą sobie odpowiadać",
    "the team list has the same entry twice: \"{W}\"":
      "lista zespołu zawiera ten sam wpis dwa razy: \u201E{W}\u201D",
    "the intents' fields {K} and {PRIMARY} hold different numbers of entries ({A} against {N}). Entries are matched by place, so a slipped row pairs the wrong ones":
      "pola {K} i {PRIMARY} w intencjach mają różną liczbę pozycji ({A} wobec {N}). Pozycje są dopasowywane według kolejności, więc przesunięty wiersz łączy niewłaściwe pary",
    "no column names a category, so every card lands on one shelf":
      "żadna kolumna nie wskazuje kategorii, więc wszystkie karty trafią do jednej kategorii",
    "this file is blocks of text with blank lines between them, of different lengths, so each block was read as one cell and no pattern was looked for; nothing in a block was dropped":
      "ten plik to bloki tekstu różnej długości rozdzielone pustymi wierszami, więc każdy blok"
      + " wczytano jako jedną komórkę i nie szukano wzoru; z żadnego bloku nic nie przepadło",
    "this file is one column with no repeating pattern in it, so it was read as one column: {CELLS}":
      "ten plik to jedna kolumna bez powtarzającego się wzoru, więc wczytano go jako jedną"
      + " kolumnę: {CELLS}",
    /* The native file dialog's two filters (item 20). */
    "Spreadsheets, text and exports": "Arkusze, pliki tekstowe i eksporty",
    "All files": "Wszystkie pliki",
    "this catalog, from a teammate": "ten katalog, od członka zespołu",
    "What it proposes": "Co proponuje",
    "What it is": "Co to jest",
    "Another catalog": "Inny katalog",
    "From a teammate": "Od członka zespołu",
    /* F2 (board 900): a file a desk stored while it was on the team; provisional, the copywriter's to replace. */
    "From a teammate since removed": "Od członka zespołu, którego już w nim nie ma",
    /* The two doors. Przyjmij wszystkie takes the count after a colon as a bare quantity,
       which is this file's second shape for a counted line: wszystkie would have to agree
       with a noun that is not on the button. */
    "Go through them": "Przejrzyj po kolei",
    /* The aftermath bar. Both counts are labels behind a colon, so neither inflects, and the
       sentence after them carries no counted noun at all. */
    "Undo": "Cofnij",
    /* The queue's own counted nouns. */
    "{N} new card": "{N} nowa karta",
    "{N} new cards": "{N} nowych kart",
    "{N} label": "{N} etykieta",
    "{N} labels": "{N} etykiet",
    "{N} removal": "{N} usunięcie",
    "{N} removals": "{N} usunięć",
    "{N} catalog field": "{N} pole katalogu",
    "{N} catalog fields": "{N} pól katalogu",
    "{N} change": "{N} zmiana",
    "{N} changes": "{N} zmian",

    /* THE STATISTICS SECTION. The counting period is the lead's standing choice. */
    "Statistics": "Statystyki",
    "Export to Excel…": "Eksportuj do Excela…",
    "Export the statistics": "Eksportuj statystyki",
    "Excel workbook": "Skoroszyt programu Excel",
    "{PROJECT}, statistics {FROM} to {TO}.xlsx": "{PROJECT}, statystyki od {FROM} do {TO}.xlsx",
    "{PROJECT}, statistics.xlsx": "{PROJECT}, statystyki.xlsx",
    "Copies in the period": "Skopiowania w okresie",
    "Copies, {LANG}": "Skopiowania, {LANG}",
    "Searches in the period": "Wyszukiwania w okresie",
    "Times asked": "Ile razy pytano",
    "All cards": "Wszystkie karty",
    "Another program holds {F} open, so nothing was written and the file stays as it was. Once it is closed there, export again.":
      "Plik {F} jest otwarty w innym programie, więc nic nie zapisano, a plik pozostał bez zmian."
      + " Po zamknięciu go tam wystarczy wyeksportować ponownie.",
    "This computer may not write in that folder, so nothing was written. Pick another, such as Documents, and export again.":
      "Ten komputer nie może zapisywać w tym folderze, więc nic nie zapisano."
      + " Wystarczy wybrać inny, na przykład Dokumenty, i wyeksportować ponownie.",
    /* A label beside a column, capitalised because the English beside it is. */
    "From": "Od",
    "Counting period": "Okres liczenia",
    "Last 30 days": "Ostatnie 30 dni",
    "This month": "Bieżący miesiąc",
    "Counted from {FROM} to {TO}.": "Liczone od {FROM} do {TO}.",
    "Last 7 days": "Ostatnie 7 dni",
    "Last month": "Poprzedni miesiąc",
    "Last 90 days": "Ostatnie 90 dni",
    "Last 12 months": "Ostatnie 12 miesięcy",
    "First day counted": "Pierwszy liczony dzień",
    "Last day counted": "Ostatni liczony dzień",
    "This period reaches back before counting began on {DATE}.": "Ten okres sięga wcześniej niż początek liczenia, {DATE}.",
    "This period reaches back before counting began.": "Ten okres sięga wcześniej niż początek liczenia.",
    "{NAMES} answered for a different period, so its figures are left out of this one.":
      "Odpowiedź członka zespołu {NAMES} dotyczy innego okresu, więc jego liczby nie są uwzględniane w tym okresie.",
    "These teammates answered for a different period, so their figures are left out of this one: {NAMES}.":
      "Odpowiedzi tych członków zespołu dotyczą innego okresu, więc ich liczby nie są uwzględniane w tym okresie: {NAMES}.",
    /* {N} sits after a colon, so the noun does not inflect. The English builds the noun with C(). */
    "Live from {COUNT}, as of {TIME}.": "Na bieżąco ze stanowisk: {N}. Stan na {TIME}.",
    "No new figures from {DESK} since {TIME}.": "Stanowisko {DESK}: brak nowych danych od {TIME}.",

    /* THE FOUR AGGREGATE VIEWS on the same section (M2, off the deferred shelf 2026-09-16
       16:08). The engineer seat's, written with the screen rather than after it, as the
       project's settings were (board 579), so the section keeps its Polish from the first day
       the views are on it.

       NOTHING HERE INFLECTS AFTER A COUNT. Every figure these views paint is a bare numeral
       after a colon or a comma, or a tile's number above its label, so no noun agrees with one
       and none of these frames needs a few-form. The one place a count sits inside a sentence
       is "Pokazano {N} z {ALL}", where both are bare and `z` takes the genitive of nothing.

       THE TABLES' COLUMN HEADS are the words `node tools/stats-read.mjs` prints, said in Polish
       through HEAD_WORD in ui/app.js (polish 04, item 9), so tests/stats-screen.mjs compares the
       two doors as strings in English. */
    "What the teammates have answered": "Co odpowiedzieli członkowie zespołu",
    "Most used cards": "Najczęściej używane karty",
    "Cards nobody used": "Karty, których nikt nie użył",
    "How much of the catalog is used": "Jaka część katalogu jest używana",
    "Who has the newest edition": "Kto ma najnowsze wydanie",
    "Every answer": "Wszystkie odpowiedzi",
    "Showing {N} of {ALL}.": "Pokazano {N} z {ALL}.",
    "Only answers counted within the period rank the cards. Left out for holding every copy since that teammate began: {N}.":
      "Kolejność ustalają tylko odpowiedzi liczone w tym okresie. Pominięte, bo obejmują wszystkie skopiowania od początku pracy tego członka zespołu: {N}.",

    /* The coverage tiles. Nieocenione rather than nieosądzone: the card is not being judged in
       the courtroom sense, it is being left out of a verdict for want of a date. */
    "Cards in the catalog": "Karty w katalogu",
    "Used at least once": "Użyte co najmniej raz",
    "Used by nobody": "Nieużywane przez nikogo",
    "Not judged": "Nieocenione",
    "Not in this catalog": "Spoza tego katalogu",
    "Searches that found nothing": "Wyszukiwania bez wyniku",

    /* The adoption tiles. Each is a place a desk is at, so each is locative and none of them
       names the edition again: the sentence above the tiles has just named it. */
    "On the newest edition": "Na najnowszym wydaniu",
    "On an older one": "Na starszym",
    "On a newer one": "Na nowszym",
    "On another catalog": "Na innym katalogu",

    /* WHAT THE NUMBERS DO NOT KNOW, which is the half of this section that matters most and the
       half a translation is likeliest to soften. Nothing here is softened. */
    "Teammates that answered: {D}. The newest answer is from {NEW}, the oldest from {OLD}.":
      "Członkowie zespołu, którzy odpowiedzieli: {D}. Najnowsza odpowiedź jest z {NEW}, najstarsza z {OLD}.",
    "A teammate that has not answered is not a teammate with no use: nothing below counts it.":
      "Członek zespołu bez odpowiedzi mógł pracować z katalogiem; liczby poniżej go nie obejmują.",
    "The teammates declared the period {FROM} to {TO}, as they declare it and not as Studio computes it.":
      "Okres podany przez członków zespołu: od {FROM} do {TO}. Studio go nie przelicza.",
    "No teammate declared a period.": "Nikt z zespołu nie zadeklarował okresu.",
    /* How the answers were counted: from a day after the period began, or since the desk began. */
    "Answers counted from a day later than {FROM}: {N}, the latest from {SINCE}. For those teammates the figures below cover only part of the period.":
      "Odpowiedzi liczone od dnia późniejszego niż {FROM}: {N}, najpóźniejsza od {SINCE}. Dla tych członków zespołu liczby poniżej obejmują tylko część okresu.",
    "Answers holding every copy since that teammate began rather than the period's: {N}. A card counts as used from such an answer only when its last copy falls within the period.":
      "Odpowiedzi z liczbami od początku pracy tego członka zespołu, a nie z tego okresu: {N}. Karta z takiej odpowiedzi liczy się jako użyta tylko wtedy, gdy ostatnio skopiowano ją w tym okresie.",
    /* Placeholders, polish 04 items 4, 6, 9: the statistics tables' heads, Show all and a
       refused answer. The copywriter's to replace. */
    "Desk": "Stanowisko",
    "Catalog": "Katalog",
    "Period (declared, not computed)": "Okres (podany, nie przeliczony)",
    "Since": "Liczone od",
    "Uses": "Użycia",
    "Misses": "Bez wyniku",
    "Langs": "Języki",
    "Desks": "Stanowiska",
    "Last used": "Ostatnie użycie",
    "First published": "Pierwsza publikacja",
    "Show all {N}": "Pokaż wszystkie: {N}",
    "Show the first 10": "Pokaż tylko pierwsze 10",
    "{FILE} is not counted: it carries {EXTRA}, which this Studio does not read.": "{FILE} nie jest liczony: zawiera {EXTRA}, a tego to Studio nie odczytuje.",
    "Every key it carries: {KEYS}": "Wszystkie klucze w pliku: {KEYS}",
    /* F2 (board 900, F-kappa1): a file of a desk since removed that Studio cannot place before the removal; provisional, the
       copywriter's to replace. */
    "{FILE} is not counted: it came from a teammate since removed, and this Studio cannot show it was stored before the removal.":
      "{FILE} nie jest liczony: pochodzi od członka zespołu, którego już w nim nie ma, a to Studio nie może wykazać, że zapisano go przed usunięciem.",
    /* Placeholder, polish 04 item 17: the copywriter's to replace. */
    "Answers Studio could not read, and which no figure below counts: {N}.":
      "Odpowiedzi, których Studio nie odczytało i których nie obejmuje żadna liczba poniżej: {N}.",
    "No teammate has answered yet.": "Nikt z zespołu jeszcze nie odpowiedział.",
    "Nothing has been published yet, so no card has a date to be judged by.":
      "Po pierwszej publikacji każda karta dostanie datę, według której można ją ocenić.",
    "No teammate declared a period, so there is no span to judge a card against.":
      "Nikt z zespołu nie zadeklarował okresu, więc nie ma zakresu, względem którego można ocenić kartę.",
    "A card is here when no teammate that answered reports a use of it within the period and it was published before {FROM}. A card published after that day is not judged.":
      "Karta jest tutaj, gdy żaden członek zespołu, który odpowiedział, nie zgłasza jej użycia w tym okresie, a została opublikowana przed {FROM}. Karta opublikowana po tym dniu nie jest oceniana.",
    "Not judged: a card published after the period began, one never published at all, or one a teammate last copied on a day that cannot be placed in the period.":
      "Nieocenione: karta opublikowana po rozpoczęciu okresu, karta nigdy nieopublikowana albo taka, której ostatniego skopiowania nie da się umieścić w tym okresie.",
    "Searches that found nothing are counted; how many searches there were is not a figure a teammate sends, so there is no share to give.":
      "Liczone są wyszukiwania bez wyniku; członkowie zespołu nie wysyłają liczby wszystkich wyszukiwań, więc odsetka nie da się podać.",
    /* Board 902: the rev first, the dated edition after it ("rev 15 (2026-10-15a)"). A draft, the copywriter's to replace. */
    "The newest edition is {EDITION}.": "Najnowsze wydanie to {EDITION}.",
    "A teammate with no catalog loaded answers with none, and is counted under another catalog rather than as one edition behind.":
      "Członek zespołu bez wczytanego katalogu jest liczony w grupie Na innym katalogu, a nie jako spóźniony o jedno wydanie.",
    "Nothing has been published yet, so there is no release to have been taken up.":
      "Po pierwszej publikacji będzie tu widać, które stanowiska mają najnowsze wydanie.",
    /* THE MONTH, IN SENTENCES (board 862): Claudette's M1 to M21, state/drafts/studio-vision-words-2026-10-07.md, as
       written. Where her English has one sentence and her Polish two (a single use reads perfective), the second English
       key carries " ##once", which the table strips from the English. Her M16 and M17 give one Polish sentence for two
       English ones, so two keys share it. */
    "In words": "Słowami",
    "View": "Widok",

    "One teammate answered for {FROM} to {TO}, on {NEWEST}.":
      "Za okres od {FROM} do {TO} odpowiedział 1 członek zespołu; odpowiedź jest z {NEWEST}.",
    "{D} teammates answered for {FROM} to {TO}, the newest on {NEWEST}.":
      "Za okres od {FROM} do {TO} odpowiedzieli członkowie zespołu: {D}; najnowsza odpowiedź jest z {NEWEST}.",
    "{D} teammates answered for {FROM} to {TO}, the newest on {NEWEST}. ##few":
      "Za okres od {FROM} do {TO} odpowiedzieli członkowie zespołu: {D}; najnowsza odpowiedź jest z {NEWEST}.",
    "answered": "odpowiedziały",
    "once": "raz",
    "The catalog was used {TIMES}, and {USED} of its {ALL} cards at least once.":
      "Z katalogu skorzystano {TIMES}; co najmniej raz użyto {USED} z jego {ALL} kart.",
    "The most used card was {A}, {TIMES_A}, then {B}, {TIMES_B}.":
      "Najczęściej sięgano po kartę {A} ({TIMES_A}), a tuż po niej po kartę {B} ({TIMES_B}).",
    "After {A}, the team went on to {B} {TIMES}, and the catalog does not link them yet.":
      "Po karcie {A} zespół przechodził dalej do karty {B} {TIMES}, choć katalog jeszcze ich nie łączy.",
    "After {A}, the team went on to {B} {TIMES}, and the catalog does not link them yet. ##once":
      "Po karcie {A} zespół raz przeszedł dalej do karty {B}, choć katalog jeszcze ich nie łączy.",
    "After {A}, the team went on to {B} {TIMES}, and they are linked from the next edition.":
      "Po karcie {A} zespół przechodził dalej do karty {B} {TIMES}; od następnego wydania katalog je łączy.",
    "After {A}, the team went on to {B} {TIMES}, and they are linked from the next edition. ##once":
      "Po karcie {A} zespół raz przeszedł dalej do karty {B}; od następnego wydania katalog je łączy.",
    "{N} more path on the map": "{N} kolejna ścieżka na mapie",
    "{N} more paths on the map": "{N} kolejnych ścieżek na mapie",
    "One card was used by nobody, though it was published before the period began.":
      "Nieużywana przez nikogo: 1 karta, opublikowana przed początkiem okresu.",
    "{COUNT} cards were used by nobody, each published before the period began.":
      "Nieużywane przez nikogo: {CARDS}, każda opublikowana przed początkiem okresu.",
    "Show it in Cards": "Pokaż ją w Kartach",
    "Show them in Cards": "Pokaż je w Kartach",
    "Every search found something. The team was asked most about {INTENT}, {TIMES}.":
      "Każde wyszukiwanie coś znalazło. Najczęściej pytano o „{INTENT}”: {TIMES}.",
    "One search found nothing. The team was asked most about {INTENT}, {TIMES}.":
      "Wyszukiwania bez wyniku: {MISSES}. Najczęściej pytano o „{INTENT}”: {TIMES}.",
    "{MISSES} searches found nothing. The team was asked most about {INTENT}, {TIMES}.":
      "Wyszukiwania bez wyniku: {MISSES}. Najczęściej pytano o „{INTENT}”: {TIMES}.",
    "Every teammate holds the newest edition, {EDITION}.": "Cały zespół ma najnowsze wydanie, {EDITION}.",
    "{ON} of the {ALL} teammates hold the newest edition, {EDITION}; one is still on an older one.":
      "Najnowsze wydanie, {EDITION}, ma w zespole {ON} z {ALL}; na starszym: {BEHIND}.",
    "{ON} of the {ALL} teammates hold the newest edition, {EDITION}; {BEHIND} are still on older ones.":
      "Najnowsze wydanie, {EDITION}, ma w zespole {ON} z {ALL}; na starszym: {BEHIND}.",
    "The one teammate holds the newest edition, {EDITION}.": "Jedyny członek zespołu ma najnowsze wydanie, {EDITION}.",
    "Counted from the answers of {D} teammates. A teammate that has not answered is not a teammate with no use: nothing above counts it. How each figure is counted is under Every answer.":
      "Liczone z odpowiedzi członków zespołu: {D}. Członek zespołu bez odpowiedzi mógł pracować z katalogiem; liczby powyżej go nie obejmują. Sposób liczenia każdej liczby jest w widoku „Wszystkie odpowiedzi”.",
    "Reading the teammates' answers.": "Trwa odczyt odpowiedzi członków zespołu.",
    "The teammates' answers are in.": "Wczytano odpowiedzi członków zespołu.",
    "Cards, with these {CARDS} ticked.": "Karty; zaznaczone: {N}.",
    /* Figures first (board 862): Claudette's F1 to F20, as written. */
    "In figures": "Liczbami",
    "of {ALL}": "z {ALL}",
    "Teammates that answered": "Członkowie zespołu, którzy odpowiedzieli",
    /* Board 902: {EDITION} carries its own word now, "wer. 15 (2026-10-15a)". A draft, the copywriter's to replace. */
    "{ON} of {ALL} on {EDITION}": "{ON} z {ALL} na {EDITION}",
    "Used: {N}": "Użyte: {N}",
    "By nobody: {N}": "Nieużywane: {N}",
    "Not judged: {N}": "Nieocenione: {N}",
    "The team's paths, not yet links": "Ścieżki zespołu bez połączenia",
    "How it is counted": "Jak to jest liczone",
    "Only answers counted within the period rank the cards.": "Kolejność ustalają tylko odpowiedzi liczone w tym okresie.",
    "The team's moves from one card to the next within the period, where the catalog has no link between the two. A link made here goes into the draft, and the team has it from the next edition.":
      "Przejścia zespołu od jednej karty do następnej w tym okresie, tam gdzie katalog ich nie łączy. Połączenie dodane tutaj trafia do szkicu, a zespół dostanie je z następnym wydaniem.",
    "Linked": "Połączono",
    "In the draft, “{A}” now leads to “{B}”; the team has it from the next edition.":
      "W szkicu karta „{A}” prowadzi teraz do karty „{B}”; zespół dostanie to z następnym wydaniem.",
    "Open the Paths map": "Otwórz mapę ścieżek",

    /* The cards table's chip, and the reorder arrows' tooltips (board 479). Wyżej and niżej
       rather than w górę and w dół: the intent moves one place in an order, not a distance. */
    "Duplicate": "Duplikat",
    "Move up": "Przenieś wyżej",
    "Move down": "Przenieś niżej",

    /* ---- THE ENGINE'S OWN WORDS ---------------------------------------------------------
       Not Claudette's and not the canvas's: pairs taken verbatim from the pinned engine's
       `src/modules/ui-lang.js`, where each is the word the engine paints on a desk, bar the one
       marked below.
       Checked against the pin with
           grep -o '"New intent":"[^"]*"' engine/pinned/src/modules/ui-lang.js
       and the same for the other three. They arrived when the Intents and Categories sections
       became editable and needed a word for an act the canvas drew no screen for. */
    "New intent": "Nowa intencja",
    "New category": "Nowa kategoria",
    "New card": "Nowa karta",
    /* Studio's own: the desk says Load for opening a catalog and leaves Import to Studio. */
    "A catalog file from an earlier Etiuda": "Plik katalogu z wcześniejszej wersji Etiudy",
    "It becomes a catalog here, ready to edit and publish.": "Stanie się tu katalogiem, gotowym do edycji i publikacji.",
    "Make it a catalog": "Utwórz z niego katalog",
    "Choose a catalog file from an earlier Etiuda": "Wybierz plik katalogu z wcześniejszej wersji Etiudy",
    "Quick facts": "Szybkie fakty",
    /* The empty Quick facts field's hint (board 976, item 8). One sentence: the drawing's
       second line about capitals was withdrawn with item 1. */
    "What the whole team should have to hand: opening hours, prices, deadlines, who does what.":
      "Co warto mieć pod ręką w całym zespole: godziny otwarcia, ceny, terminy, kto czym się zajmuje.",
    "Delete card": "Usuń kartę",
    "Delete": "Usuń",
    "Name": "Nazwa",
    /* The intent's clause, the head of its fields in Intents (board 1018, piece C): the desk's own pair, checked with
           grep -o '"Clause":"[^"]*"' engine/pinned/src/modules/ui-lang.js */
    "Clause": "Fraza",
    /* An intent's comment action and a category's look, the heads of their fields (board 1018, piece A): the desk's own
       pairs, checked the same way. The colours keep the engine's own names, which its table leaves untranslated. */
    "Comment action": "Czynność do komentarza",
    "Icon": "Ikona",
    "Colour": "Kolor",
    "Supporting category": "Kategoria wspierająca",
    /* A card's own flags, address and language (board 1018, piece B): the desk's own pairs, checked the same way. */
    "{PAX} as first name only": "{PAX} jako samo imię",
    "{PAX} in the vocative": "{PAX} w wołaczu",
    "Manual override of {PAX}": "Ręczne ustawienie {PAX}",
    "Wears {INT} under every intent": "Oznaczenie {INT} przy każdej intencji",
    "First among the cards marked {INT}": "Pierwsza wśród kart oznaczonych {INT}",
    "Always one language": "Zawsze jeden język",
    "By name": "Po imieniu",
    /* Studio's own, the copywriter's (Claudette, 2026-11-22). {FIELD} is
       the field's key, so the Polish puts pole before it. */
    "Card settings": "Ustawienia karty",
    "No, the language in use": "Nie, język w użyciu",
    "{FIELD} is on, off or left for the desk to work out, not {VALUE}":
      "pole {FIELD} może być włączone, wyłączone albo zostawione do ustalenia stanowisku, nie {VALUE}",
    "forms of address exist for en and pl only, not {CODE}": "formy zwracania się istnieją tylko dla en i pl, nie dla {CODE}",
    "{FORM} is not a form of address this version of Etiuda offers": "{FORM} to nie forma zwracania się, którą oferuje ta wersja Etiudy",
    /* An icon or a colour left to the look a desk works out; the copywriter's, the same brief. */
    "Automatic": "Automatycznie",
    "Export": "Eksportuj",
    /* The name of the file type in the export and upgrade dialogs' lists, which the shell wrote
       in English until the page passed it (survey finding 26); the engine's own pair, the name
       its desk gives the same list:
           grep -o '"Etiuda catalog file":"[^"]*"' engine/pinned/src/modules/ui-lang.js */
    "Etiuda catalog file": "Plik katalogu Etiudy",
    /* The wizard's and the review queue's Back button, taken rather than invented (479). */
    "Back": "Wstecz",

    /* THE TOUR'S FURNITURE, EIGHT PAIRS (board 720), from the desk's tour so the two read alike.
       Five are the engine's at the pin, checked with
           grep -o '"Skip tour":"[^"]*"' engine/pinned/src/modules/ui-lang.js
       and the same for Next, Finish, Back and Not now; the counter, "New here?" and "Show tour"
       are not on the pin (the desk's menu says "Show tour…"), so those three are Studio's own.
       The ten steps' words below are Studio's argument to a buyer, the Polish the copywriter's. */
    "Tour {N} / {TOTAL}": "Przewodnik {N} / {TOTAL}",
    "Skip tour": "Pomiń przewodnik",
    "Next": "Dalej",
    "Finish": "Zakończ",
    "New here?": "Pierwszy raz tutaj?",
    "Not now": "Nie teraz",
    "Show tour": "Pokaż przewodnik",
    /* A COMPANY PROXY'S QUESTION (ui/proxy-ask.js), the desk's own placeholders for the copywriter, word for word as the pinned
       engine paints them, checked with
           grep -o '"User name":"[^"]*"' engine/pinned/src/modules/ui-lang.js
       and the same for the other three; Not now is above, and Sign in is Account's. */
    "The network proxy asks for a sign-in": "Serwer proxy w sieci prosi o zalogowanie",
    "The proxy asked again, so the user name or password may need another look.": "Serwer proxy zapytał ponownie, więc nazwę użytkownika lub hasło warto sprawdzić jeszcze raz.",
    "User name": "Nazwa użytkownika",
    "Password": "Hasło",
    /* The invite's own sentence, then each step's title and body (board 744). */
    "How one person keeps the wording the whole team sends, in about two minutes.":
      "Jak jedna osoba dba o treść, którą wysyła cały zespół. Około dwóch minut.",
    "A catalog is a folder": "Katalog to folder",
    "Etiuda Studio runs on this computer. A catalog is one folder on disk holding its draft, every edition you have published, and the details that travel with it. Copy the folder and you have copied the catalog. <b>What travels, and how</b>: on the Etiuda relay, everything travels sealed under the team's key, so the relay carries it without being able to read it and only the team opens it; in a shared folder, editions travel however that folder is shared, over the organisation's own network or a sync service it chose. Beyond that, Studio connects to etiuda.dev for its licence and, about once an hour, to see whether a newer version is out, which an administrator can switch off; it never downloads or installs anything by itself. Where an AI service is set, a job the lead starts sends to that service alone, and only once the lead has seen what goes. What the lead sends to it may include customers' own words, where the lead chose them; etiuda.dev never receives them in a form it can read.":
      "Etiuda Studio działa na tym komputerze. Katalog to jeden folder na dysku: jest w nim szkic, każde opublikowane wydanie i szczegóły, które wędrują razem z nim. Skopiowanie folderu to skopiowanie katalogu. <b>Co wędruje i jak</b>: przez przekaźnik Etiudy wszystko jedzie zapieczętowane kluczem zespołu, więc przekaźnik to przenosi, ale nie może tego przeczytać, a otwiera to tylko zespół; we wspólnym folderze wydania wędrują tak, jak ten folder jest udostępniany: przez własną sieć organizacji albo wybraną przez nią usługę synchronizacji. Poza tym Studio łączy się z etiuda.dev w sprawie licencji oraz mniej więcej co godzinę, by sprawdzić, czy jest nowsza wersja, co administrator może wyłączyć; niczego samo nie pobiera ani nie instaluje. Jeśli ustawiono usługę AI, zadanie rozpoczęte przez lidera zespołu wysyła tekst tylko do niej i dopiero wtedy, gdy lider zespołu zobaczy, co zostanie wysłane. Wysyłany tam tekst może zawierać słowa klientów, jeśli wybrał je lider zespołu; do etiuda.dev nigdy nie trafiają one w postaci możliwej do odczytania.",
    "Every computer on the team is a teammate. Here you invite teammates and remove one that should no longer be on the team. An invitation, a link on the relay or a code to paste for a shared folder, works once: the teammate that takes it comes in by itself, and a request that arrives without one waits here for your answer.":
      "Każdy komputer w zespole to członek zespołu. Tutaj zaprasza się członków i wyłącza z zespołu tych, którzy nie powinni już w nim być. Zaproszenie, czyli odnośnik w przypadku przekaźnika albo kod do wklejenia w przypadku wspólnego folderu, działa jeden raz: członek zespołu, który z niego skorzysta, dołącza sam, a prośba bez zaproszenia czeka tutaj na odpowiedź.",
    "Bring in the replies you already have": "Odpowiedzi, które już istnieją",
    /* S1: tour does not promise Proposals for an empty catalog */
    "Point this at a spreadsheet or an export and Studio reads it here, on this computer. It shows you what it made of every column and lets you correct the guesses before anything is kept. Into an empty catalog the rows go straight in; once it has cards, they land in <b>Proposals</b>, not in the catalog, so an import you dislike is discarded rather than undone.<br><br>In the Library, <b>Bring in your replies</b> turns any file into a new catalog, a whole catalog file included.":
      "Wystarczy wskazać arkusz albo eksport, a Studio odczyta go tutaj, na tym komputerze. Pokaże, co rozpoznało w każdej kolumnie, i pozwoli poprawić to przed zapisaniem czegokolwiek. Do pustego katalogu wiersze trafiają od razu; gdy katalog ma już karty, trafiają do <b>Propozycji</b>, a nie do katalogu, więc nieudany import wystarczy odrzucić, bez cofania.<br><br>W Bibliotece przycisk <b>Importuj odpowiedzi</b> tworzy z każdego pliku nowy katalog, również z całego pliku katalogu.",
    "Every card, in every language": "Każda karta w każdym języku",
    "One row a card. A language gets a column, and the column says whether that card has text in it yet, not what the text is. <b>empty</b> is a card waiting for its translation, which is a state and not a fault: the catalog publishes as it stands and a desk set to that language shows the first language instead of a hole.<br><br>Add or remove a language under <b>Catalog details</b> in the list at the left, and a column appears here.":
      "Jeden wiersz to jedna karta, a każdy język ma swoją kolumnę. Kolumna mówi, czy karta ma już tekst w tym języku, a nie, jak ten tekst brzmi. <b>brak</b> oznacza kartę, która czeka na tekst w tym języku: to stan, a nie błąd. Katalog można opublikować w obecnej postaci, a stanowisko ustawione na ten język pokaże w tym miejscu język główny zamiast pustego miejsca.<br><br>Języki dodaje się i usuwa w <b>Szczegółach katalogu</b> na liście po lewej, a każdy nowy język dostaje tu własną kolumnę.",
    "Writing a card": "Pisanie karty",
    "Click a row and it opens here. What you type is kept as you type it, in the catalog's draft, so there is nothing to save; the desks see it once you publish.<br><br>A word in braces like <span class='mono'>{AGENT}</span> is filled in at the desk that uses the card, so one card serves everybody. The chip under the text says which ones this card uses.":
      "Kliknięty wiersz otwiera się tutaj. Tekst zapisuje się w trakcie pisania, w szkicu katalogu, więc nie trzeba niczego zapisywać; stanowiska zobaczą go po publikacji.<br><br>Słowo w nawiasach klamrowych, takie jak <span class='mono'>{AGENT}</span>, wypełnia się na stanowisku, które używa karty, więc jedna karta służy wszystkim. Etykieta pod tekstem pokazuje, których takich słów używa ta karta.",
    "What the checks are for": "Do czego służy kontrola",
    "Studio checks the catalog when you open it, after an import, and again before you publish. A finding names the card it is about and <b>Jump to it</b> opens that card with the finding still on screen. A row about a language still awaited names that language instead, and <b>Show the cards</b> opens the cards still waiting for its text.<br><br>A duplicate title, a variable no desk fills, a card with nothing in it: the sort of thing nobody notices until an agent sends it to a customer.":
      "Studio sprawdza katalog przy otwarciu, po imporcie i jeszcze raz przed publikacją. Uwaga wskazuje kartę, której dotyczy, a <b>Przejdź do karty</b> otwiera ją z uwagą wciąż widoczną na ekranie. Wiersz o brakującym języku wskazuje zamiast karty sam język, a <b>Pokaż te karty</b> otwiera karty, które wciąż czekają na tekst w tym języku.<br><br>Powtórzony tytuł, zmienna, której nie wypełnia żadne stanowisko, karta bez treści: rzeczy, których nikt nie zauważa, dopóki agent nie wyśle ich klientowi.",
    "Publishing writes a file": "Publikacja zapisuje plik",
    "Publish stamps the draft with the next rev, writes it into the folder your team reads from, and keeps a copy in the catalog's own archive. Before it does, it shows you what it is about to write and what the checks found.<br><br><b>Each desk offers the new edition to the person at it, and none of them loads it on its own.</b> Nobody's screen changes under their hands while they are talking to a customer.":
      "Publikacja nadaje szkicowi numer wersji, zapisuje go w folderze, z którego czyta zespół, i zachowuje kopię w archiwum katalogu. Wcześniej pokazuje, co dokładnie zapisze i co wykazała kontrola.<br><br><b>Każde stanowisko proponuje nowe wydanie osobie, która przy nim pracuje, i żadne nie wczytuje go samo.</b> Nikomu nie zmienia się ekran w trakcie rozmowy z klientem.",
    "Changes coming back": "Poprawki wracają",
    "An agent who improves a card at their own desk exports it, and the file lands in this folder. Studio reads it, shows you each change beside the wording it would replace, and writes nothing until you say so.<br><br>When something is waiting, two circles appear in the corner beside <b>+</b>: one opens the queue, one opens it with every row already ticked.":
      "Kto poprawi kartę na swoim stanowisku, może ją wyeksportować, a plik trafi do tego folderu. Studio go odczytuje, pokazuje każdą zmianę obok treści, którą miałaby zastąpić, i niczego nie zapisuje bez decyzji.<br><br>Gdy coś czeka, w rogu obok <b>+</b> pojawiają się dwa kółka: jedno otwiera kolejkę, drugie otwiera ją z wszystkimi wierszami już zaznaczonymi.",
    "Proving what you shipped": "Dowód tego, co wydano",
    "Every edition you publish is kept in <b>Archive</b>, and any two of them can be compared line by line. <b>Audit</b> on an edition accounts for it: how many cards were written here, how many came from a proposal and who accepted it, and whether the content still hashes to what the file claims.<br><br><b>Export this pack</b> writes that account out as a folder to hand to somebody who asks.":
      "Każde opublikowane wydanie zostaje w <b>Archiwum</b>, a dowolne dwa można porównać wiersz po wierszu. <b>Audyt</b> przy wydaniu je rozlicza: ile kart napisano tutaj, ile przyszło z propozycji i kto je przyjął, oraz czy suma kontrolna treści wciąż zgadza się z tym, co podaje plik.<br><br><b>Eksportuj ten pakiet</b> zapisuje to rozliczenie jako folder, gotowy do przekazania każdemu, kto o nie poprosi.",
    "Everything else": "Cała reszta",
    "This button opens the Menu, with the settings of <b>this copy of Studio</b>: where catalogs are kept, light or dark, the language of the buttons, and the key a published catalog is signed with.<br><br>This tour is here too, whenever you want it again.":
      "Ten przycisk otwiera menu z ustawieniami <b>tej kopii Studia</b>: gdzie są przechowywane katalogi, motyw jasny albo ciemny, język przycisków i klucz, którym podpisuje się opublikowany katalog.<br><br>Ten przewodnik też tu jest, zawsze gdy będzie potrzebny.",

    /* THE SETTINGS COVER IS THE ENGINE'S WORDS ENTIRE, not one of these pairs invented
       here: Studio's Settings holds the same controls the engine's own Settings holds, in the
       same values, so the desk and the manager's program say the same word for the same thing.
       Checked against the pin with
           grep -o '"Interface language":"[^"]*"' engine/pinned/src/modules/ui-lang.js
       and the same for each of the others. The two language names are the engine's practice
       rather than its table - its Interface language control labels each language in that
       language - so "English" and "Polski" are written where they are used and translated
       nowhere. The pair Claudette wrote in the third pass (board 538) for the model key's row
       went with that row, when Maxim ruled on 2026-09-28 13:19 that Etiuda's own code calls no
       model; "Later" (Później) was the row's value and went with it. "Appearance" (Wygląd) was the
       theme row's heading until Settings became one cover of four rows (b0e5883), and went in
       board 858, the last pair no source named. */
    "Settings": "Ustawienia",
    "Catalog details": "Szczegóły katalogu",
    /* THE SETTINGS TAB (board 965, S1): the copywriter's rows of 2026-11-08 (office brief words-settings-2026-11-08.md, rows
       0 to 7, 10, 12, 14 to 18, 20 to 23, 80 and 81), landed as she wrote them in both languages. "Settings" (row 9) is the
       pair above. "Library folder" replaces "Catalogs" as the folder row's name, renamed with the Library (row 80). The
       ledes of Layout, Keyboard shortcuts and Notifications are said by the section table already and painted once those
       sections hold a row. */
    "General": "Ogólne",
    "Appearance": "Wygląd",
    "Layout": "Układ",
    "Keyboard shortcuts": "Skróty klawiszowe",
    "Notifications": "Powiadomienia",
    "Teams and keys": "Zespoły i klucze",
    "Data and defaults": "Dane i ustawienia domyślne",
    "About": "O programie",
    "Search settings": "Szukaj w ustawieniach",
    "No setting matches this search.": "Żadne ustawienie nie pasuje do tego wyszukiwania.",
    /* All settings page (taken verbatim from the engine's `src/modules/ui-lang.js`):
           grep -o '"All settings":"[^"]*"' engine/pinned/src/modules/ui-lang.js
           grep -o '"Opens this section alone":"[^"]*"' engine/pinned/src/modules/ui-lang.js */
    "All settings": "Wszystkie ustawienia",
    "Opens this section alone": "Otwiera tylko tę sekcję",
    /* The page's lede, the copywriter's (office brief words-studio-all-settings-lede-2026-11-16.md): the desk's sentence with Studio's name. */
    "Every setting Studio has, on one page.": "Wszystkie ustawienia Studia na jednej stronie.",
    /* THE KEYBOARD SHORTCUTS TAB (board 965, S4): the copywriter's page note (office brief words-settings-2026-11-08.md,
       row 100), word for word in both languages. "new key", "Rename" and "Maintenance panel" are existing pairs. */

    /* Keyboard shortcuts rebinding (board 965, S4b), borrowed from engine ui-lang.js */
    "Reset shortcuts": "Przywróć skróty",
    "Shortcuts reset": "Przywrócono domyślne skróty",
    "Click, then press the new key combo": "Kliknij, a następnie naciśnij nową kombinację klawiszy",
    "An alternative: click, then press the key combo": "Skrót alternatywny: kliknij, a następnie naciśnij kombinację klawiszy",
    "Press the new shortcut (Esc to cancel, Ctrl+Backspace for the default)": "Oczekiwanie na nowy skrót (Esc anuluje, Ctrl+Backspace przywraca domyślny)",
    "Press the alternative (Esc to cancel, Ctrl+Backspace to clear)": "Oczekiwanie na skrót alternatywny (Esc anuluje, Ctrl+Backspace usuwa)",
    "Press keys…": "Naciśnij klawisze…",
    "Saved {KEY}": "Zapisano {KEY}",
    "{KEY} is fixed and keeps its own meaning": "{KEY} to klawisz stały i zachowuje swoje znaczenie",
    /* Shortcut recording refusal for field keys (board 965, S4b, Claudette 2026-11-09 05:12). */
    "{KEY} is needed for typing, so it cannot be a shortcut, and nothing was changed. An F key, or a combination with Ctrl or Alt, will do.":
      "{KEY} jest potrzebny do pisania, więc nie może być skrótem, i nic nie zmieniono. Można wybrać klawisz F albo połączenie z Ctrl lub Alt.",
    "This key is needed for typing, so it cannot be a shortcut, and nothing was changed. An F key, or a combination with Ctrl or Alt, will do.":
      "Ten klawisz jest potrzebny do pisania, więc nie może być skrótem, i nic nie zmieniono. Można wybrać klawisz F albo połączenie z Ctrl lub Alt.",
    /* The copywriter's words for the shortcuts registry (board 965, S4), 2026-11-09 04:51 and 04:52, word for word. */
    "Rename what is focused, where it stands": "Zmienia nazwę zaznaczonego elementu w miejscu",
    "Open the Maintenance tab: readings about this computer, and its recovery tools": "Otwiera zakładkę Konserwacja: odczyty tego komputera i narzędzia naprawcze",
    "All open catalogs": "Wszystkie otwarte katalogi",
    "See the open catalogs side by side": "Pokazuje otwarte katalogi obok siebie",
    "Find and replace text across the catalog": "Wyszukuje i zamienia tekst w całym katalogu",
    "Take back what was just done, while its Undo button is on screen": "Cofa to, co właśnie zrobiono, dopóki na ekranie jest przycisk Cofnij",
    "Next tab": "Następna zakładka",
    "Switch to the next tab, round to the first after the last": "Przełącza na następną zakładkę, a po ostatniej wraca do pierwszej",
    "Previous tab": "Poprzednia zakładka",
    "Switch to the previous tab, round to the last after the first": "Przełącza na poprzednią zakładkę, a po pierwszej wraca do ostatniej",
    "Close tab": "Zamknij zakładkę",
    "Close the tab in front": "Zamyka zakładkę na wierzchu",
    "Next finding": "Następna uwaga",
    "Go to the next finding in the catalog": "Przechodzi do następnej uwagi w katalogu",
    "Move next card up": "Przesuń następną kartę wyżej",
    "Move the focused one of Next cards up the list": "Przesuwa zaznaczoną kartę wyżej na liście następnych kart",
    "Move next card down": "Przesuń następną kartę niżej",
    "Move the focused one of Next cards down the list": "Przesuwa zaznaczoną kartę niżej na liście następnych kart",
    "Remove next card": "Usuń następną kartę",
    "Take the focused card off Next cards; the card itself stays": "Zdejmuje zaznaczoną kartę z listy następnych kart; sama karta zostaje",
    "Back along the path": "Wstecz po ścieżce",
    "Step back along the path on the Paths map": "Cofa o krok po ścieżce na mapie ścieżek",
    "Zoom in": "Powiększ",
    "Make text and controls larger": "Powiększa tekst i przyciski",
    "Zoom out": "Pomniejsz",
    "Make text and controls smaller": "Pomniejsza tekst i przyciski",
    "Reset zoom": "Zwykły rozmiar",
    "Return text and controls to their usual size": "Przywraca zwykły rozmiar tekstu i przycisków",
    "Move card left": "Przenieś kartę w lewo",
    "Move the focused card to the nearest open category on the left": "Przenosi zaznaczoną kartę do najbliższej rozwiniętej kategorii po lewej",
    "Move card right": "Przenieś kartę w prawo",
    "Move the focused card to the nearest open category on the right": "Przenosi zaznaczoną kartę do najbliższej rozwiniętej kategorii po prawej",
    "Forgets Studio's settings, the Opened recently list and the open tabs. Catalogs, the licence, the teams and the signing key stay.": "Usuwa z tego komputera ustawienia Studia, listę Ostatnio otwierane i otwarte zakładki. Katalogi, licencja, zespoły i klucz podpisu zostają.",
    "The language, the Library's folder, and how Studio starts and closes.": "Język, folder Biblioteki oraz sposób uruchamiania i zamykania Studia.",
    "How the app looks and moves.": "Jak program wygląda i jak się porusza.",
    "How the screen is laid out.": "Jak rozłożony jest ekran.",
    "Every shortcut, and how to change it.": "Wszystkie skróty i sposób ich zmiany.",
    "What the app tells you, also while its window is closed.": "O czym program powiadamia, także gdy jego okno jest zamknięte.",
    "This Studio's signing key and its licence.": "Klucz podpisu tego Studia i jego licencja.",
    "Putting settings back, and what the app keeps on this computer.": "Przywracanie ustawień i to, co program przechowuje na tym komputerze.",
    "The version, the licence and the tour.": "Wersja, licencja i przewodnik.",
    "A catalog's own team and invitations are on its Team screen, and its name, folder and languages in its Catalog details.": "Zespół i zaproszenia katalogu są na jego ekranie Zespół, a nazwa, folder i języki w Szczegółach katalogu.",
    "Library folder": "Folder Biblioteki",
    "Where new catalogs are made.": "Tu powstają nowe katalogi.",
    /* THE MAINTENANCE TAB (board 967, S2): the copywriter's rows of 2026-11-08 (office brief words-settings-2026-11-08.md,
       rows 95, 97, 116 to 124, 130, 131, 134, 135, 137 to 155, 162 to 164), landed as she wrote them in both languages.
       "Library" and "Signing key" (rows 133, 136) are existing pairs. */
    "new key": "nowy skrót",
    "Maintenance panel": "Panel konserwacji",
    "Maintenance": "Konserwacja",
    "Etiuda Studio Maintenance Report": "Etiuda Studio: raport z Konserwacji",
    "Health": "Stan",
    "present": "jest",
    "(maximised)": "(zmaksymalizowane)",
    "supported": "obsługiwane",
    "What this computer reports, and ways to set things right.": "Co raportuje ten komputer i jak przywrócić porządek.",
    "Readings": "Odczyty",
    "Done": "Gotowe",
    "Reset defaults and Clear local memory are in Settings, under Data and defaults.": "Przywróć domyślne i Wyczyść pamięć lokalną są w Ustawieniach, w części Dane i ustawienia domyślne.",
    "Last start": "Ostatnie uruchomienie",
    "Last crash": "Ostatnia awaria",
    "not recorded": "nierejestrowane",
    "relay reachable": "przekaźnik osiągalny",
    "relay out of reach": "przekaźnik nieosiągalny",
    "catalogs: {N} · folder present": "katalogi: {N} · folder jest",
    "catalogs: {N} · folder missing": "katalogi: {N} · brak folderu",
    "present · backed up": "jest · ma kopię zapasową",
    "present · no backup": "jest · bez kopii zapasowej",
    "Relay": "Przekaźnik",
    "Background work": "Praca w tle",
    "running": "działa",
    "stopped": "zatrzymana",
    "library folder": "folder Biblioteki",
    "data folder": "folder danych",
    "open catalogs": "otwarte katalogi",
    "teams": "zespoły",
    "teams: {T} · teammates: {N}": "zespoły: {T} · członkowie: {N}",
    "key print": "odcisk klucza",
    "engine": "silnik",
    "spelling": "pisownia",
    "window": "okno",
    "notifications": "powiadomienia",
    "local memory used": "użyta pamięć lokalna",
    "Copy report": "Kopiuj raport",
    "Every reading above as text, for whoever helps.": "Wszystkie odczyty powyżej jako tekst, dla osoby, która pomaga.",
    "Re-read the library": "Wczytaj Bibliotekę ponownie",
    "Reads every catalog's folder again, as at a start.": "Odczytuje foldery wszystkich katalogów od nowa, jak przy uruchomieniu.",
    "Re-read": "Wczytaj ponownie",
    /* RESET STUDIO IN MAINTENANCE (Claudette, words-resets-2026-11-09.md section 3): */
    "Reset Studio": "Zresetuj Studio",
    "Returns Studio to a fresh install, keeping the licence, the signing key, the teams and the catalogs' own folders.":
      "Przywraca Studio do stanu po świeżej instalacji; zostają licencja, klucz podpisu, zespoły i foldery katalogów.",
    "Reset Studio?": "Zresetować Studio?",
    "Studio's settings, caches, open tabs and local history go. The catalogs stay in their folders, and the Library finds them again by itself.":
      "Znikną ustawienia Studia, pamięć podręczna, otwarte zakładki i lokalna historia. Katalogi zostają w swoich folderach, a Biblioteka sama znajdzie je ponownie.",
    "The teams and their keys stay, with the signing key and its backup copies, so this Studio keeps leading its teams. The licence stays too, and so does everything in the catalogs' folders on disk.":
      "Zostają zespoły i ich klucze, a także klucz podpisu wraz z kopiami zapasowymi, więc to Studio nadal prowadzi swoje zespoły. Zostaje też licencja i wszystko, co jest w folderach katalogów na dysku.",
    "There is no Undo.": "Tego nie da się cofnąć.",
    "Type RESET to confirm.": "Do potwierdzenia trzeba wpisać RESET.",
    "Studio is starting again as freshly installed.": "Studio uruchamia się ponownie jak po świeżej instalacji.",
    "The reset of Etiuda Studio did not finish. Could not be removed, perhaps in use by another program or an open folder: {PATH}.":
      "Reset Etiudy Studio nie został dokończony. Nie udało się usunąć elementów, których być może używa inny program albo otwarty folder: {PATH}.",
    "Trying again finishes it once they are closed; stopping it keeps Studio as it is now.":
      "Ponowna próba dokończy reset po ich zamknięciu; przerwanie zostawi Studio w obecnym stanie.",
    "Try again": "Spróbuj ponownie",
    "Stop the reset": "Przerwij reset",
    "unavailable": "niedostępne",
    "Light": "Jasny",
    "Dark": "Ciemny",
    "System": "Systemowy",
    "System follows your computer's own setting.":
      "Systemowy podąża za ustawieniem tego komputera.",
    "Interface language": "Język interfejsu",
    /* THE SETTINGS S3 WORDS (board 965): rows 41, 42, 78, 79, 82, 83, 88 to 94, 113, 115. */
    "Reopen the last catalogs": "Przywracaj ostatnio otwarte katalogi",
    "Their tabs come back as they were.": "Ich zakładki wracają w tym samym układzie.",
    "Animations": "Animacje",
    "The publish map, the opening and the turning mark. Off when the system asks for reduced motion.":
      "Mapa publikacji, otwarcie i obracający się znak. Wyłączone, gdy system prosi o ograniczenie ruchu.",
    "Density": "Gęstość",
    "Comfortable": "Wygodna",
    "Compact": "Zwarta",
    "How tall the rows are in tables and lists.": "Wysokość wierszy w tabelach i na listach.",
    "Opening a catalog": "Otwieranie katalogu",
    "In a new tab": "W nowej zakładce",
    "In this tab": "W tej zakładce",
    "Reset defaults": "Przywróć domyślne",
    "Puts every setting back as it ships, except the AI service and its key. Catalogs are not touched. The key is removed from the Menu, under Settings, then AI service, with Forget the key.":
      "Przywraca wszystkie ustawienia do stanu wyjściowego, z wyjątkiem usługi AI i jej klucza. Katalogi zostają bez zmian. Klucz usuwa się z menu, w Ustawieniach, w części Usługa AI, przyciskiem Usuń klucz.",
    "Starting and closing": "Uruchamianie i zamykanie",
    "Start with Windows": "Uruchamiaj razem z systemem Windows",
    "Etiuda Studio starts in the tray when this Windows account signs in.": "Etiuda Studio uruchamia się w zasobniku po zalogowaniu do tego konta Windows.",
    "When the window closes": "Po zamknięciu okna",
    "Stay in the tray": "Zostaje w zasobniku",
    "Say so at the first close": "Informuj przy pierwszym zamknięciu",
    "Once each start, a blue bubble over the tray icon says Etiuda Studio keeps running there. Don't show again in the bubble turns this off.": "Raz po każdym uruchomieniu niebieski dymek nad ikoną w zasobniku informuje, że Etiuda Studio działa tam dalej. Przycisk Nie pokazuj więcej w dymku wyłącza tę opcję.",
    "Quit": "Kończy działanie",
    "In the tray, Studio still receives proposals and requests to join.": "W zasobniku Studio nadal odbiera propozycje i prośby o dołączenie.",
    "Recent catalogs": "Ostatnie katalogi",
    "Open Etiuda Studio": "Otwórz Etiudę Studio",
    "Notifications: on": "Powiadomienia: wł.",
    "Notifications: off": "Powiadomienia: wył.",
    "Quit Etiuda Studio": "Zakończ Etiudę Studio",
    "Etiuda Studio keeps running in the tray": "Etiuda Studio działa dalej w zasobniku",
    "Proposals and requests to join still arrive. The tray icon quits it, and Settings, under General, changes this.": "Propozycje i prośby o dołączenie wciąż docierają. Program zamyka się z ikony w zasobniku, a to zachowanie zmienia się w Ustawieniach, w części Ogólne.",
    "Notifications from Etiuda Studio, also while its window is closed.": "Powiadomienia od Etiudy Studio, także gdy okno programu jest zamknięte.",
    "A count on the tray icon": "Licznik na ikonie w zasobniku",
    "How much is waiting for an answer.": "Ile spraw czeka na odpowiedź.",
    "Tell me when": "Powiadamiaj, gdy",
    "A teammate sends a proposal": "Członek zespołu wysyła propozycję",
    "Someone asks to join a team": "Ktoś prosi o dołączenie do zespołu",
    "Proposals waiting: {N}": "Czekające propozycje: {N}",
    "Requests to join waiting: {N}": "Czekające prośby o dołączenie: {N}",
    "Etiuda Studio: waiting: {N}": "Etiuda Studio: czeka: {N}",
    "{NAME} sent a proposal": "Propozycja od członka zespołu: {NAME}",
    "A teammate sent a proposal": "Nowa propozycja od członka zespołu",
    "{CATALOG}. Changed cards: {C} · new cards: {N}.": "{CATALOG}. Zmienione karty: {C} · nowe karty: {N}.",
    "{NAME} asks to join {TEAM}": "Prośba o dołączenie do zespołu {TEAM}: {NAME}",
    "It waits on the Team screen.": "Czeka na ekranie Zespół.",
    /* THE SIGNING KEY'S TWO WORDS ARE NOT CLAUDETTE'S YET (board 605, 2026-09-20). The engine
       paints nothing about signing, so there was nothing to borrow and nothing to wait for
       without leaving the row half in English on a Polish desk; they are written here by the
       engineer seat and are the copywriter's to confirm or replace. "Klucz podpisu" is the key the
       signature is made with rather than a key that is itself signed; the empty state follows the engine's own impersonal form
       ("nie wybrano jeszcze folderu"), with utworzono because a key is made rather than chosen. */
    "Signing key": "Klucz podpisu",
    "Signing key settings": "Ustawienia klucza podpisu",
    /* Placeholder, polish 04 item 21: the copywriter's to replace. */
    "{FILE} is not a signing key this Studio can read":
      "{FILE} nie jest kluczem podpisu, który to Studio potrafi odczytać",
    /* The Settings row's remedy for that file (board 931, finding 8): the second half of the refusal's sentence below, said
       under the row's own. The lead engineer's words and the draft Polish, for the copywriter to replace. */
    "Once it is moved out of that folder, Studio can make a new key; catalogs signed by the old key then verify only with the old key's backup copy.":
      "Po przeniesieniu pliku poza ten folder Studio może utworzyć nowy klucz; katalogi podpisane starym kluczem zweryfikuje się wtedy tylko kopią zapasową starego klucza.",
    "no signing key yet": "nie utworzono jeszcze klucza",
    "Change folder…": "Zmień folder…",
    "Close": "Zamknij",
    /* The tour's row (board 720): the copywriter's two pairs, the desk having no resuming form. */
    "Tour": "Przewodnik",
    "Continue the tour ({N} of {OF})": "Wróć do przewodnika (krok {N} z {OF})",

    /* ---- THE MENU, THE ABOUT AND THE STATUS BAR (Maxim, 2026-10-06 21:13: S1, S2 at S3's size, F3)
     *
     * Claudette's, from state/drafts/studio-about-2026-10-06.md, landed as written in both languages
     * and in her row order: M for the Menu's list, A for the About, B for the bar along the window's
     * foot. The Menu's version badge, the About's number and dates, the project's name and folder
     * are data and have no pair; "Etiuda Studio" at the About's head is the brand and has none either.
     */
    "Settings…": "Ustawienia…",
    "Show tour…": "Pokaż przewodnik…",
    "About Etiuda Studio": "O Etiudzie Studio",
    "Version": "Wersja",
    "Released on {DATE}": "z {DATE}",
    "Publishes for": "Zgodność",
    "Etiuda {ENGINE} and later": "Etiuda od wersji {ENGINE}",
    "Every edition this Studio publishes opens on a desk running that version or a newer one.":
      "Każde wydanie z tego Studia otworzy się na stanowisku z tą wersją Etiudy lub nowszą.",
    "Licence terms": "Warunki licencji",
    "Etiuda End-User Licence Agreement": "Umowa licencyjna Etiudy",
    "An organisation holds a subscription to Etiuda with Studio for each author it names. Publishing is open while the subscription is current, and the catalogs stay the organisation's own, to open, edit and export at any time.":
      "Organizacja ma subskrypcję Etiudy ze Studiem dla każdego ze swoich autorów. Publikowanie jest"
      + " otwarte, dopóki subskrypcja jest aktualna, a własne katalogi można zawsze otwierać, edytować"
      + " i eksportować.",
    "Read the licence": "Przeczytaj umowę",
    "Source": "Kod źródłowy",
    "Etiuda Source-Available Licence 1.0": "Licencja Etiuda Source-Available 1.0",
    "Governs the published source of Etiuda, on which Studio is built.":
      "Obejmuje opublikowany kod źródłowy Etiudy, na którym zbudowane jest Studio.",
    /* The trademark notice, the About's credit after the copyright, in Maxim's words: registration
       changes this pair and its one call in ui/app.js, and tests/licence.mjs holds the installer's
       texts to it. */
    "Etiuda is a trademark of Max Gwiazda.": "Etiuda jest znakiem towarowym Maxa Gwiazdy.",
    /* The licensor line, between the notice and the maker; a no-break space holds NIP to its number. */
    "Licensor: Stardust Maxim Gwiazda, NIP\u00a05242711262, Poland.":
      "Licencjodawca: Stardust Maxim Gwiazda, NIP\u00a05242711262, Polska.",
    /* The maker line; "Stardust" in it becomes the link, in either language. */
    "Made by Stardust.": "Etiuda Studio. Tworzy je Stardust.",
    "draft saved": "szkic zapisany",
    "saving the draft…": "zapisywanie szkicu…",
    "changes waiting to be written to the folder": "zmiany czekają na zapis w folderze",
    "a change was not saved": "nie udało się zapisać zmiany",
    "published rev {REV}": "wersja\u00a0{REV} opublikowana",
    "Catalog folder: {FOLDER}": "Folder katalogu: {FOLDER}",
    "Etiuda Studio {VERSION}": "Etiuda Studio {VERSION}",
    /* The maximise button's name, the desk's words; "Restore" is the card's own word, and the same. */
    "Maximise": "Maksymalizuj",
    "Made by Stardust": "Tworzy je Stardust",

    /* ---- THE PROJECT'S OWN SETTINGS, AND THE LANGUAGES IT DECLARES (board 579) ---------------
     *
     * A DIFFERENT SCREEN FROM THE ONE ABOVE AND THE WORDS ARE NOT SHARED. The rows above are
     * this MACHINE's settings, behind the band's Menu button; these are the CATALOG's, in the
     * rail, and they travel with the folder to any machine. "Settings" is the one word both use
     * and it is the same word in both senses.
     *
     * WRITTEN BY THE ENGINEER SEAT AND THE COPYWRITER'S TO CONFIRM, as the signing key's two
     * words above were: a screen left half in English on a Polish desk is worse than a pair she
     * may want to replace, and `tests/polish.mjs` would keep every other word on this screen in
     * English until the last of them arrived.
     *
     * TWO SHAPES ARE FORCED BY POLISH AND NEITHER IS A STYLE. A count behind its own noun is a
     * pair of bare numerals - "Karty 24/24" - because "24 z 24 kart" puts a preposition in front
     * of a counted phrase, which the nominative cannot follow; and a LANGUAGE in a frame sits at
     * the head behind a colon, because a language's name would have to inflect anywhere else and
     * the frame cannot see which case it is in.
     */
    "Declared languages": "Języki katalogu",
    "Where it lives": "Gdzie się znajduje",
    "What this catalog is called, where it lives, and the languages it speaks. Every desk that reads it reads what is declared here.":
      "Nazwa katalogu, jego miejsce na dysku i języki. Stanowiska czytają te ustawienia razem z katalogiem.",
    "Primary": "Główny",
    "Remove": "Usuń",
    "Add a language": "Dodaj język",
    "Code": "Kod",
    "A code, as en and pl are, and what the language is called in itself.":
      "Kod, na przykład en albo pl, i nazwa języka w tym języku.",
    "Every card must carry this one. A card with no text in another language shows this one on the desk instead of a hole.":
      "Każda karta musi mieć tekst w tym języku. Kartę bez tekstu w innym języku stanowisko"
      + " pokazuje w tym języku, zamiast zostawiać puste miejsce.",
    /* THE ENGINE'S OWN REFUSAL, SAID IN OUR WORDS RATHER THAN QUOTED. The pinned reader pushes
       "langs: this build has no columns for de, it reads en and pl" and refuses the catalog; the
       codes it can read arrive as {READS}, a comma-separated list, because "en and pl" would put
       an English conjunction inside a Polish sentence. */
    "{LANG}: a desk built from this engine has no columns for it and refuses a catalog that declares it. It reads {READS}. Adding a column is an engine release.":
      "{LANG}: Etiuda na stanowiskach w obecnej wersji nie obsługuje tego języka i nie wczyta"
      + " katalogu, który go zawiera. Obsługuje: {READS}. Nowy język przychodzi z nową wersją"
      + " Etiudy.",
    "{LANG}: removing it discards its text":
      "{LANG}: usunięcie języka usuwa też cały tekst w tym języku",
    /* words: placeholder */
    "Pinned cards": "Przypięte karty",
    "Nothing on disk refers to it afterwards, and this catalog has no other copy of it.":
      "Ten katalog nie ma innej kopii tego tekstu i nic na dysku nie będzie się już do niego odwoływać.",
    "A published edition keeps a copy of it.":
      "Kopia tego tekstu zostaje w opublikowanym wydaniu.",
    "The removal can be undone from Changes.":
      "Usunięcie można cofnąć na liście Zmiany.",
    "Remove this language and its text": "Usuń ten język i jego tekst",
    "Keep it": "Zostaw",
    "{LANG}: as the primary language": "{LANG}: jako język główny",
    "Every card must carry the primary language. Without text in this one: {CARDS}.":
      "Każda karta musi mieć tekst w języku głównym. Bez tekstu w tym języku: {CARDS}.",
    "Make it the primary": "Ustaw jako główny",
    "Keep the order": "Zostaw kolejność",
    "Catalog name": "Nazwa katalogu",
    "Catalog folder": "Folder katalogu",
    "The draft, its archive, and the inbox an agent drops a file into.":
      "Szkic, jego archiwum i skrzynka, do której agent wrzuca plik.",
    "Open the folder": "Otwórz ten folder",
    "Change file name": "Zmień nazwę pliku",
    "Use this name": "Użyj tej nazwy",
    "What every desk lists it as. A new name keeps what each desk has made its own.":
      "Tak katalog nazywa się na każdym stanowisku. Nowa nazwa zachowuje to, co każde stanowisko"
      + " dostosowało u siebie.",
    "The published file takes this name at once, without a publish.":
      "Opublikowany plik przyjmie tę nazwę od razu, bez publikacji.",
    "Last published": "Ostatnia publikacja",
    "never": "nigdy",
    "A teammate that has not synced since then is reading the one before.":
      "Kto w zespole nie zsynchronizował się od tego czasu, ma jeszcze poprzednie wydanie.",
    "{N} edition kept": "{N} zachowane wydanie",
    "{N} editions kept": "{N} zachowanych wydań",
    "Every published edition, and the difference between any two.":
      "Każde opublikowane wydanie i różnica między dowolnymi dwoma.",
    "The language of comments": "Język komentarzy",
    "A catalog may speak five languages and be commented in one.":
      "Katalog może mówić pięcioma językami i być komentowany w jednym.",

    /* What the shell says when something does not work. Lower case in both, because both are
       set into a sentence. */
    "the card was not saved": "nie udało się zapisać karty",
    "that folder did not open": "nie udało się otworzyć tego folderu",

    /* ---- THE REFUSALS, AS A CLASS ------------------------------------------------------------
     *
     * Board 523, from `copywriter-studio-pass-2.md` section 4, under Maxim's ruling of 479 that
     * the refusals join the pass with the plural written by count. Forty-one frames, each the
     * key its own `refuse()` call in `src/*.mjs` or `shell/main.js` was given; `tests/polish.mjs`
     * section 7 scans those calls against these keys, so a refusal added later either brings its
     * Polish or is kept out of the class deliberately.
     *
     * EVERY ONE OF THEM IS IN ONE OF THREE SHAPES, because `C()` gives the nominative and Polish
     * can put a counted phrase nowhere else: the count at the head as the subject, the count
     * behind a colon where the words before it are a label and agree with nothing, or the count
     * after a comma as a bare statement of quantity. None takes a finite verb after a count.
     *
     * THE REFUSAL IS LOWER CASE AND SET INTO A SENTENCE, as the shell paints it inside a dashed
     * box; the three that open with the name of the thing refused keep their capital because the
     * name is a proper noun the person typed.
     *
     * WHAT IS NOT HERE IS NOT AN OVERSIGHT. A sentence that can only come from a command line,
     * and a sentence reporting a fault in this program rather than in what a person did, both
     * stay English and stay out of the class: `src/refusal.mjs` says why at length.
     */

    /* The project and its folder. */
    "{DIR} holds no catalog: a catalog folder holds project.json, or the one draft an import wrote":
      "w folderze {DIR} nie ma katalogu; folder katalogu zawiera project.json albo jeden plik <id>.draft.json zapisany przy imporcie",
    "no catalog in {DIR}": "w folderze {DIR} nie ma katalogu",
    "a catalog needs a name": "katalog musi mieć nazwę",
    /* The five a person meets when they declare a language (board 579). The removal puts its
       counts behind a colon as a bare statement of quantity, which is the second of the three
       shapes above; nothing in it takes a finite verb after a count. */
    "{CODE} is not a language code: a code is two or three letters, as en and pl are":
      "{CODE} nie jest kodem języka: kod to dwie albo trzy litery, takie jak en i pl",
    "this catalog already declares {CODE}": "ten katalog ma już język {CODE}",
    "a catalog speaks at least one language, and none was declared":
      "katalog musi mieć co najmniej jeden język, a nie podano żadnego",
    "{CODE} is the only language this catalog declares, and a catalog speaks at least one":
      "{CODE} to jedyny język tego katalogu, a katalog musi mieć co najmniej jeden",
    /* words: placeholder. "Cards pinned to it" is new; the rest of each sentence is unchanged. */
    "removing {CODE} discards its text and nothing else holds a copy: {CARDS}, {INTENTS}, {CATS}. Cards pinned to it: {PINS}. Ask again to remove it.":
      "usunięcie {CODE} oznacza utratę jego tekstu, którego nigdzie indziej nie ma: {CARDS},"
      + " {INTENTS}, {CATS}. Karty przypięte do niego: {PINS}. Ponowne kliknięcie usunie ten język.",
    "removing {CODE} discards its text from the draft: {CARDS}, {INTENTS}, {CATS}. Cards pinned to it: {PINS}. A published edition keeps a copy, and the removal can be undone from Changes. Ask again to remove it.":
      "usunięcie {CODE} usuwa jego tekst ze szkicu: {CARDS}, {INTENTS}, {CATS}. Karty przypięte do niego: {PINS}. Kopia zostaje"
      + " w opublikowanym wydaniu, a usunięcie można cofnąć na liście Zmiany. Ponowne kliknięcie"
      + " usunie ten język.",
    "every card must carry the primary language, and some have no {CODE} text: {CARDS}. Ask again to make it the primary.":
      "każda karta musi mieć tekst w języku głównym. Bez tekstu {CODE}: {CARDS}. Ponowne"
      + " kliknięcie ustawi ten język jako główny.",
    "there is already a folder at {DIR}": "pod ścieżką {DIR} jest już folder",
    /* Claudette's words, 2026-11-15 (Grok's review 29, finding 2) */
    "{FILE} in the folder moved on to rev {REV} while this edition was being made, so nothing was written there. Publishing again goes out above it.":
      "W czasie przygotowywania tego wydania w folderze pojawiła się wersja {REV} pliku {FILE}, więc nic tam nie zapisano. Ponowna publikacja wyjdzie z wyższym numerem.",
    /* Claudette's words, 2026-11-15 (Grok's review 29, finding 1) */
    "The team's key changed while this edition was being made, so nothing was written over {FILE}. The next publish seals it under the team's current key.":
      "W czasie przygotowywania tego wydania zmienił się klucz zespołu, więc nic nie zapisano w miejsce pliku {FILE}. Następna publikacja zapieczętuje wydanie bieżącym kluczem zespołu.",
    "{FOLDER} already holds {FILE}, which is another catalog's file, so nothing was published. Under another file name this one can go out.":
      "W folderze {FOLDER} jest już plik {FILE}, czyli plik innego katalogu, więc nic nie zostało opublikowane. Pod inną nazwą pliku ten katalog może zostać opublikowany.",
    "{FOLDER} already holds {FILE}, which is this catalog's file under another name, so nothing was published. Choosing {FILE} under Change file name in Catalog details, or taking that file away, lets the next publish go out.":
      "W folderze {FOLDER} jest już plik {FILE}, czyli plik tego samego katalogu pod inną nazwą, więc nic nie zostało opublikowane. Wybranie nazwy {FILE} w ustawieniu Zmień nazwę pliku albo usunięcie tego pliku pozwoli opublikować katalog następnym razem.",
    /* The same refusal for a project that has never been published (board 831): no Settings row
       exists yet, so the sentence points at the cover's File name. */
    "{FOLDER} already holds {FILE}, which is this catalog's file under another name, so nothing was published. Putting {FILE} back as the file name on this screen, or taking that file out of the folder, lets the publish go out.":
      "W folderze {FOLDER} jest już plik {FILE}, czyli plik tego samego katalogu pod inną nazwą, więc nic nie opublikowano. Publikacja się uda, jeśli na tym ekranie wpisze się nazwę pliku {FILE} albo zabierze ten plik z folderu.",
    /* A catalog's latest edition brought into a team's place (src/publish.mjs carryEdition), meeting another catalog under
       the same file name (board 962 stage 5). */
    "{FILE} in the team's place is another catalog's file, or a file this Studio cannot open, so it was left as it is and nothing was written. Under another file name, this catalog can go there.":
      "Plik {FILE} w miejscu zespołu należy do innego katalogu albo to plik, którego to Studio nie potrafi otworzyć, więc pozostawiono go bez zmian i nic nie zapisano. Pod inną nazwą pliku ten katalog może tam trafić.",
    /* A linked copy and "Bring up to the original" (src/link.mjs, board 962, 2026-11-08 16:36): Catalog details' rows and the
       press's refusals, in the copywriter's words (2026-11-08 20:39). */
    "Linked to": "Oryginał",
    "Linked copy": "Połączona kopia",
    "Make a linked copy": "Utwórz połączoną kopię",
    "Bring up to the original": "Pobierz zmiany z oryginału",
    "For a second team: a catalog of its own, which one press brings up to this one through the review.": "Dla drugiego zespołu: osobny katalog, do którego jednym przyciskiem pobiera się zmiany z tego katalogu, do przejrzenia.",
    "The original has published rev {REV} since this copy was last brought up to it.": "Od ostatniego pobrania zmian w oryginale opublikowano wer. {REV}.",
    "Up to date with the original's latest published edition.": "Najnowsze opublikowane wydanie oryginału jest już pobrane.",
    "The original is no longer among this Studio's catalogs, so there is nothing to bring.": "Oryginału nie ma już wśród katalogów tego Studia, więc nie ma czego pobrać.",
    "What the last press brought waits in the review queue.": "Zmiany z ostatniego pobrania czekają w przeglądzie.",
    "this catalog is not a linked copy, so there is no original to bring it up to": "ten katalog nie jest połączoną kopią, więc nie ma oryginału, z którego można pobrać zmiany",
    "the original of this linked copy, catalog {ID}, is not in {DIR} any more, so nothing was brought": "oryginał tej połączonej kopii, katalog {ID}, nie znajduje się już w {DIR}, więc nic nie zostało pobrane",
    "this catalog has no id yet, so a linked copy of it could not say what it was copied from": "ten katalog nie ma jeszcze identyfikatora, więc połączona kopia nie mogłaby wskazać, z czego ją skopiowano",
    "brought from the original catalog at rev {REV}: each row is a change made there since this copy last took it in": "pobrane z oryginalnego katalogu w wer. {REV}: każdy wiersz to zmiana wprowadzona tam od ostatniego przyjęcia zmian przez tę kopię",
    /* A catalog taken off its team or moved to another (board 962 stage 6, U1): shell/main.js, src/studio.mjs leaveTeam, src/publish.mjs. */
    "{FOLDER} is the place of a sealed team, and this catalog is not one of its catalogs, so it was not published there in the clear. Nothing was written.": "Folder {FOLDER} należy do zapieczętowanego zespołu, a ten katalog nie jest jednym z jego katalogów, więc nie opublikowano go tam jawnie. Nic nie zapisano.",
    "The team file in {FOLDER} is not the team this Studio leads, so the catalog was not taken off it. Nothing was changed.": "Plik zespołu w folderze {FOLDER} nie należy do zespołu, który prowadzi to Studio, więc nie odłączono od niego katalogu. Nic nie zmieniono.",
    "A move or a handover of this team is under way, so no catalog can be taken off it until that ends. Nothing was changed.": "Trwa przeniesienie lub przekazanie tego zespołu, więc dopóki się nie zakończy, nie można odłączyć od niego żadnego katalogu. Nic nie zmieniono.",
    "The relay licence for this team has ended, so no catalog can be taken off it until the licence is renewed. Nothing was changed.": "Licencja na przekaźnik dla tego zespołu wygasła, więc dopóki nie zostanie odnowiona, nie można odłączyć od niego żadnego katalogu. Nic nie zmieniono.",
    "The relay no longer accepts this team's relay licence, so no catalog can be taken off it until Studio has a new one. Studio is fetching it, and nothing needs doing. Nothing was changed.": "Przekaźnik nie przyjmuje już licencji na przekaźnik dla tego zespołu, więc dopóki Studio nie otrzyma nowej, nie można odłączyć od niego żadnego katalogu. Studio już ją pobiera i nic nie trzeba robić. Nic nie zmieniono.",
    "The relay no longer accepts this team's relay licence, so no catalog can be taken off it until Studio has a new one. Nothing was changed.": "Przekaźnik nie przyjmuje już licencji na przekaźnik dla tego zespołu, więc dopóki Studio nie otrzyma nowej, nie można odłączyć od niego żadnego katalogu. Nic nie zmieniono.",
    "This Studio does not lead that team as a sealed one, so no catalog was taken off it. Nothing was changed.": "To Studio nie prowadzi tego zespołu jako zapieczętowanego, więc nie odłączono od niego żadnego katalogu. Nic nie zmieniono.",
    "This catalog is on no team, so there is no team to take it off. Nothing was changed.": "Ten katalog nie należy do żadnego zespołu, więc nie ma go od czego odłączyć. Nic nie zmieniono.",
    "This catalog is part way through a move to another team, so it can be taken off only once the move is finished or the catalog is back on its old team. Nothing was changed.": "Ten katalog jest w trakcie przenoszenia do innego zespołu, więc można go odłączyć dopiero po dokończeniu przenoszenia albo po przywróceniu do dawnego zespołu. Nic nie zmieniono.",
    "This catalog is on no team, so it cannot be moved; it can be added to a team instead. Nothing was changed.": "Ten katalog nie należy do żadnego zespołu, więc nie można go przenieść; można go natomiast dodać do zespołu. Nic nie zmieniono.",
    "This catalog is on that team already, so it was not moved. Nothing was changed.": "Ten katalog jest już w tym zespole, więc go nie przeniesiono. Nic nie zmieniono.",
    "The catalog is off its old team, and that team's place has not yet taken the change, so for now it is on no team. Finish the move completes it.": "Katalog jest już odłączony od dawnego zespołu, ale miejsce tego zespołu nie przyjęło jeszcze zmiany, więc na razie nie należy do żadnego zespołu. Przenoszenie można dokończyć przyciskiem Dokończ przenoszenie.",
    "Publishing cannot be set to Plain for a team with more than one catalog. Nothing was changed.": "W zespole z więcej niż jednym katalogiem Publikowania nie można ustawić na Jawne. Nic nie zmieniono.",
    "The name could not be written, and the folder could not be put back either: the catalog now lies in {NOW}, and was in {WAS}. Nothing is lost. Open it where it lies, or move the folder back by hand.":
      "Nie udało się zapisać nazwy, a folderu nie udało się też przywrócić: katalog leży teraz w folderze {NOW}, a był w {WAS}. Nic nie zginęło; można otworzyć go tam, gdzie leży, albo przenieść folder z powrotem ręcznie.",
    "The name could not be recorded, and the file could not be put back either: the catalog file now lies in {FOLDER} as {NOW}, and its record still says {WAS}. Choosing {NOW} under Change file name repairs the record, and until then a publish is refused.":
      "Nie udało się zapisać nazwy, a pliku nie udało się też przywrócić: plik katalogu leży teraz w folderze {FOLDER} jako {NOW}, a jego zapis nadal podaje {WAS}. Wybranie nazwy {NOW} w ustawieniu Zmień nazwę pliku naprawia zapis, a do tego czasu publikowanie jest odrzucane.",
    "{FOLDER} already holds a file named {FILE}, so the catalog keeps {NAME}. Any name not yet in that folder will do.":
      "W folderze {FOLDER} jest już plik {FILE}, więc katalog zachowuje nazwę {NAME}. Wystarczy"
      + " nazwa, której w tym folderze jeszcze nie ma.",
    "{FILE} in {FOLDER} is another catalog's file, so it stays where it is and this catalog's file keeps its name.":
      "Plik {FILE} w folderze {FOLDER} należy do innego katalogu, więc zostaje na miejscu, a plik tego katalogu zachowuje swoją nazwę.",
    "{TEXT} leaves no letter from a to z or digit for a file name":
      "Z {TEXT} nie zostaje dla nazwy pliku żadna litera od a do z ani cyfra",
    "The team reads this catalog from {DIR}, which is inside the catalog's own folder, so renaming it would move that folder out of its reach. Change folder beside Writes to chooses one outside the catalog, and the rename can follow.":
      "Zespół czyta ten katalog z folderu {DIR}, który leży w folderze samego katalogu, więc zmiana nazwy przeniosłaby go poza jego zasięg. Przycisk Zmień folder przy polu Miejsce zapisu pozwala wybrać folder poza katalogiem, a potem można już zmienić nazwę.",
    "there is already a folder at {DIR}; an import never writes over a catalog that is already there":
      "pod ścieżką {DIR} jest już folder; import nigdy nie nadpisuje katalogu, który już tam jest",
    "there is already a folder at {DIR}; an upgrade never writes over a catalog that is already there":
      "pod ścieżką {DIR} jest już folder; aktualizacja nigdy nie nadpisuje katalogu, który już tam jest",
    "This catalog is already in Studio at {DIR}, so it comes in as a second copy under the name above.":
      "Ten katalog jest już w Studiu, w folderze {DIR}, więc trafi tu jako druga kopia pod nazwą podaną wyżej.",
    "{FILE} is a table rather than a catalog file: Import into this catalog, in any open catalog, reads tables and can make one a new catalog":
      "{FILE} to tabela, a nie plik katalogu: tabele czyta Importuj do katalogu, dostępne w każdym otwartym katalogu, i może też zrobić z tabeli nowy katalog",
    "{FILE} could not be read as a catalog file, perhaps because it is damaged or is not a catalog file at all":
      "nie udało się odczytać {FILE} jako pliku katalogu, być może dlatego, że plik jest uszkodzony albo w ogóle nie jest plikiem katalogu",
    "no folder at {P}": "pod ścieżką {P} nie ma folderu",
    "no file at {P}": "pod ścieżką {P} nie ma pliku",
    /* A draft, the copywriter's to replace. */
    "the paste has no reply in it": "we wklejonym tekście nie ma żadnej odpowiedzi",
    "this catalog has no folder yet: choose the folder the team reads from first":
      "ten katalog nie ma jeszcze folderu: najpierw trzeba wybrać folder, z którego czyta zespół",
    /* Nic nie zapisano is impersonal, so neither line picks a sex for whoever is reading. */
    "{PROBLEMS}, nothing written: {LIST}": "{PROBLEMS}, nic nie zapisano: {LIST}",
    "{DIFFERENCES} on the way back, nothing written: {LIST}":
      "{DIFFERENCES} w drodze powrotnej, nic nie zapisano: {LIST}",

    /* An id or a name. Łącznik, not myślnik: myślnik is the dash this house does not use, and
       the character in an id is the hyphen. */
    "{TEXT} gives the id {ID}, which the format refuses: an id is 3 to 64 characters of a to z, 0 to 9 and the hyphen":
      "{TEXT} daje id {ID}, którego format nie przyjmuje: id to od 3 do 64 znaków, a do z, 0 do 9"
      + " i łącznik",
    "a category needs a name in {LANG}, the primary language this catalog declares":
      "kategoria musi mieć nazwę w języku głównym katalogu ({LANG})",
    "an intent needs a name in {LANG}, the primary language this catalog declares":
      "intencja musi mieć nazwę w języku głównym katalogu ({LANG})",
    "a card needs a title in {LANG}, the primary language this catalog declares":
      "karta musi mieć tytuł w języku głównym katalogu ({LANG})",
    /* On screen the wizard's own field is what a person uses, so both languages name it; the
       command line keeps its flag, as `refuse`'s third argument. */
    "the catalog id {ID} is not 3 to 64 characters of a to z, 0 to 9 and the hyphen; an id of your own can be typed in its place":
      "id katalogu {ID} nie spełnia zasad: od 3 do 64 znaków spośród a do z, 0 do 9 i łącznika;"
      + " można wpisać własne id",
    /* saveTag's and saveCard's refusals (board 1018, pieces A and B), the copywriter's, the same brief. */
    "this catalog has no language {CODE}": "w tym katalogu nie ma języka {CODE}",
    /* words: placeholder. The refusals of a field given in a shape the verb cannot write (the test architect's F1). */
    "{FIELD} cannot be {VALUE}": "pole {FIELD} nie może mieć wartości {VALUE}",
    "a category has no field {FIELD}": "kategoria nie ma pola {FIELD}",
    "an intent has no field {FIELD}": "intencja nie ma pola {FIELD}",
    "an intent has no icon, colour or supporting mark; only a category has them":
      "intencja nie ma ikony, koloru ani oznaczenia kategorii wspierającej; mają je tylko kategorie",
    "{ICON} is not an icon this version of Etiuda offers": "{ICON} to nie ikona, którą oferuje ta wersja Etiudy",
    "{HUE} is not a colour this version of Etiuda offers": "{HUE} to nie kolor, który oferuje ta wersja Etiudy",
    "a thousand intents and categories already have an id made from {BASE}; a name with different letters makes a new one, since capitals, accents and punctuation do not count":
      "tysiąc intencji i kategorii ma już id utworzone od {BASE}; nowe da nazwa z innymi literami, bo wielkie litery, znaki diakrytyczne i interpunkcja się nie liczą",

    /* Something is not there. Znacznik is the engine's own word for a tag in its Polish. */
    "no card {ID} in {FILE}": "w pliku {FILE} nie ma karty {ID}",
    "no card {ID} in this catalog": "w tym katalogu nie ma karty {ID}",
    "no category {ID} in this catalog": "w tym katalogu nie ma kategorii {ID}",
    "no intent {ID} in this catalog": "w tym katalogu nie ma intencji {ID}",
    "no tag {ID} in this catalog": "w tym katalogu nie ma intencji ani kategorii {ID}",

    /* The archive and the published file. */
    "the archive at {P} has no edition {E}; it has {LIST}":
      "archiwum w {P} nie ma wydania {E}; ma wydania: {LIST}",
    "the archive at {P} has no edition {E}": "archiwum w {P} nie ma wydania {E}",
    "no archived catalog file at {P}": "pod ścieżką {P} nie ma zarchiwizowanego pliku katalogu",
    "an export needs a file to write, and not the archived copy itself":
      "eksport musi mieć plik docelowy inny niż kopia w archiwum",
    "the archive already holds {E} at {P}; an archived edition is immutable and this one would have been written over":
      "archiwum ma już wydanie {E} w {P}; wydanie w archiwum jest niezmienne, a to zostałoby"
      + " nadpisane",
    "{DIR} has no project.json: a catalog folder holds project.json and draft.json, and an import makes the draft":
      "w folderze {DIR} nie ma project.json; folder katalogu zawiera project.json i draft.json, a szkic powstaje przy imporcie",
    "the catalog names its draft as {NAME} and there is nothing at {P}":
      "katalog wskazuje swój szkic jako {NAME}, a pod ścieżką {P} nic nie ma",
    /* An author's bad day (sense pass 2): the disk's three families, a damaged project file, and
       a publish with no folder chosen. The engineer seat's draft, written from purpose in both
       languages; placeholders for the copywriter. */
    "Could not reach {P}, perhaps because the drive or share it is on is not connected. Once it is, try again.":
      "Nie udało się dotrzeć do {P}: być może dysk lub udział, na którym się znajduje, nie jest"
      + " podłączony. Po podłączeniu wystarczy spróbować ponownie.",
    "Could not write to {P}, perhaps because it is read-only or another program has it open. Once it is free, try again.":
      "Nie udało się zapisać {P}: być może jest tylko do odczytu albo otwarty w innym programie."
      + " Gdy będzie wolny, wystarczy spróbować ponownie.",
    "Could not write to {P}, because the drive it is on is full. Once there is room on it, try again.":
      "Nie udało się zapisać {P}, bo dysk, na którym się znajduje, jest pełny. Po zwolnieniu"
      + " miejsca wystarczy spróbować ponownie.",
    /* The copywriter's words. Another copy of Studio saving the same catalog (src/studio.mjs unlessStale). */
    "Another copy of Studio is saving this catalog at the same moment, in {DIR}, so this change is not written yet. Nothing is lost: it stays here and is written with the next change, or on leaving this catalog.":
      "Inna kopia Studia zapisuje w tej chwili ten katalog w {DIR}, więc ta zmiana nie jest jeszcze zapisana. Nic nie przepada: zostaje tutaj i zostanie zapisana przy następnej zmianie albo po opuszczeniu tego katalogu.",
    /* The copywriter's words. A lock folder left by a copy of Studio that stopped, which cannot be removed (src/studio.mjs unlessStale). */
    "Studio could not remove the folder {LOCK}, left behind by a copy of Studio that stopped while saving, so this change is not written yet. Nothing is lost: it stays here, and once that folder is deleted, it is written with the next change or on leaving this catalog.":
      "Studio nie zdołało usunąć folderu {LOCK}, pozostawionego przez kopię Studia zatrzymaną w trakcie zapisywania, więc ta zmiana nie jest jeszcze zapisana. Nic nie przepada: zostaje tutaj, a po usunięciu tego folderu zostanie zapisana przy następnej zmianie albo po opuszczeniu tego katalogu.",
    /* The copywriter's words. One Studio holds a projects folder at a time (shell/main.js holdCheck, src/root-hold.cjs). */
    "Etiuda Studio on {COMPUTER} already has {ROOT} open, and one Studio works in a projects folder at a time, so nothing was opened from it here. Quit Studio on {COMPUTER}, or choose another projects folder, then try again.":
      "Etiuda Studio na komputerze {COMPUTER} ma już otwarty folder {ROOT}, a w jednym folderze projektów pracuje naraz tylko jedno Studio, więc niczego z niego tu nie otwarto. Wystarczy zakończyć Studio na komputerze {COMPUTER} albo wybrać inny folder projektów i spróbować ponownie.",
    "Another copy of Etiuda Studio on this computer already has {ROOT} open, and one Studio works in a projects folder at a time, so nothing was opened from it here. Quit that copy, or choose another projects folder, then try again.":
      "Inna kopia Etiudy Studio na tym komputerze ma już otwarty folder {ROOT}, a w jednym folderze projektów pracuje naraz tylko jedno Studio, więc niczego z niego tu nie otwarto. Wystarczy zakończyć tamtą kopię albo wybrać inny folder projektów i spróbować ponownie.",
    "Studio cannot tell whether another copy has {ROOT} open, because it cannot read or replace {FILE}, so nothing was opened from it. Once that file is deleted, try again.":
      "Studio nie może ustalić, czy inna kopia ma otwarty folder {ROOT}, bo nie może odczytać ani zastąpić pliku {FILE}, więc niczego z niego nie otwarto. Po usunięciu tego pliku wystarczy spróbować ponownie.",
    "{FILE} is damaged and cannot be read, so this catalog cannot open. Studio has left the file as it is; every published rev is kept whole in {ARCHIVE}.":
      "Plik {FILE} jest uszkodzony i nie da się go odczytać, więc tego katalogu nie można otworzyć. Studio zostawiło plik bez zmian; każda opublikowana wersja jest zachowana w całości w {ARCHIVE}.",
    "{FILE} is damaged and cannot be read, so this catalog cannot open. Studio has left the file as it is.":
      "Plik {FILE} jest uszkodzony i nie da się go odczytać, więc tego katalogu nie można otworzyć. Studio zostawiło plik bez zmian.",
    "Publishing needs the folder the team reads from, and Change beside Writes to chooses it.":
      "Do publikacji potrzebny jest folder, z którego czyta zespół; wybiera się go przyciskiem Zmień przy polu Miejsce zapisu.",
    /* The licence the cover says (board 745, and the ruling of 2026-09-24 02:01). The copywriter's words. */
    "The licence file could not be read just now, perhaps because another program has it open. Publishing goes on as normal, and Studio tries again at its next look.":
      "Nie udało się teraz odczytać pliku licencji, być może dlatego, że ma go otwartego inny program. Publikowanie działa normalnie, a Studio spróbuje ponownie przy następnym sprawdzeniu.",
    /* A trial is a signed licence (src/licence.mjs TRIAL_KIND). The second is the one calm sentence after a trial's end,
       said on the publish cover and as the refusal of publishing, statistics and proposals alike (TRIAL_PAUSED). */
    "Trial licence until {DATE}": "Licencja próbna do dnia {DATE}",
    /* Review xi: a licence held by sign-in whose organisation, seats and updates the service has
       not said. The copywriter's words. */
    "A licence is held through this account's sign-in; its organisation and seats show once the service has answered.": "Licencja jest przypisana do tego konta przez logowanie; organizacja i liczba miejsc pojawią się, gdy usługa odpowie.",
    "The trial ended on {DATE}. Publishing, statistics and proposals are paused until a licence is bought; editing, checks and export stay open. Signing in then brings the licence here.":
      "Okres próbny skończył się dnia {DATE}. Publikowanie, statystyki i propozycje są wstrzymane do czasu zakupu licencji; edycja, kontrola i eksport działają dalej. Zalogowanie się przeniesie potem licencję tutaj.",
    "A licence file goes at {FILE}.": "Miejsce na plik licencji: {FILE}.",
    /* The licence states a seat count, not names (licence format 3): the lead engineer's draft in
       both languages, for the copywriter to finish. A seat is "miejsce", never "stanowisko", which
       is the desk in Etiuda's Polish. */
    "{ORG}, seats: {N}, devices per seat: {D}, updates until {DATE}":
      "{ORG}, miejsca: {N}, urządzenia na miejsce: {D}, aktualizacje do {DATE}",
    /* Saved data a newer Studio wrote (the copywriter's words, Claudette, 2026-11-01). */
    "This Studio's saved data were written by Etiuda Studio {VERSION} or newer, so this version leaves them untouched. Installing Etiuda Studio {VERSION} or newer opens them as they were.":
      "Dane tego Studia zapisało Etiuda Studio w wersji {VERSION} lub nowszej, więc ta wersja zostawia je nietknięte. Po zainstalowaniu Etiudy Studio w wersji {VERSION} lub nowszej otworzą się bez zmian.",
    /* the copywriter's (2026-11-01, 081eb32e) */
    "This Studio's saved data were written by a newer Etiuda Studio, so this version leaves them untouched. Installing the newest Etiuda Studio opens them as they were.":
      "Dane tego Studia zapisała nowsza wersja Etiudy Studio, więc ta wersja zostawia je nietknięte. Po zainstalowaniu najnowszej wersji Etiudy Studio otworzą się bez zmian.",
    /* the copywriter's (2026-11-01, 081eb32e) */
    "This edition needs Etiuda {VERSION} or newer, and these desks run an older one: {NAMES}. They keep the edition they have until a newer Etiuda is installed there.":
      "To wydanie wymaga Etiudy w wersji {VERSION} lub nowszej, a te stanowiska mają starszą: {NAMES}. Zostaną przy wydaniu, które już mają, dopóki nie zostanie na nich zainstalowana nowsza Etiuda.",
    /* the copywriter's (2026-11-01, f21c8b89): the desks that have not reported a version, one and more */
    "1 desk has not reported its version yet, so it may need a newer Etiuda too.":
      "Jedno stanowisko nie podało jeszcze wersji, więc także ono może potrzebować nowszej Etiudy.",
    /* the copywriter's (2026-11-01, f21c8b89) */
    "Desks that have not reported their version yet: {N}. Some of them may need a newer Etiuda too.":
      "Stanowiska, które nie podały jeszcze wersji: {N}. Także one mogą potrzebować nowszej Etiudy.",
    /* the copywriter's (2026-11-01, 081eb32e) */
    "Publish anyway": "Opublikuj mimo to",
    /* the copywriter's (2026-11-01, 081eb32e) */
    "Etiuda version": "Wersja Etiudy",
    /* the copywriter's (2026-11-01, 081eb32e) */
    "not reported yet": "jeszcze nie podana",
    "{FILE} was not used: {WHY}": "Plik {FILE} nie został użyty: {WHY}",
    "this copy of Studio cannot check a licence yet":
      "ta kopia programu nie może jeszcze sprawdzać licencji",
    "its signature does not match its contents": "podpis nie zgadza się z treścią",
    "it is a licence of a format this version does not read":
      "to licencja w formacie, którego ta wersja nie czyta",
    "it cannot be read as a licence": "nie da się go odczytać jako licencji",

    /* Something is still in use. THE TWO MAXIM RULED KEEP THEIR ENGLISH WORDING (479); the
       Polish is new, and the count moves behind a colon because jest na 2 kartach would need
       the locative, which C() cannot make. Ją agrees with intencja in the second. */
    "{TAG} is on {CARDS}. Move or delete cards in this category first.":
      "{TAG} jest jeszcze w użyciu: {CARDS}. Kategorię można usunąć, gdy jej karty zostaną"
      + " przeniesione albo usunięte.",
    "{TAG} is on {CARDS}. Take it off them first.":
      "{TAG} jest jeszcze w użyciu: {CARDS}. Intencję można usunąć po odłączeniu jej od tych kart.",

    /* The import. */
    "the CSV has a header and no rows": "plik CSV ma nagłówek i ani jednego wiersza",
    "{FILE}, beside the file being imported, is empty. Once it is filled in or moved to another folder, a second import goes ahead; without it, the file being imported is read on its own.":
      "obok importowanego pliku leży pusty plik {FILE}. Wystarczy go uzupełnić albo przenieść do innego folderu i zaimportować jeszcze raz; bez niego Studio przeczyta sam importowany plik.",

    /* THE WORKBOOK READER'S REFUSALS (board 641). A skoroszyt is a workbook and an arkusz is
       one sheet of one, which is the distinction the English makes with "workbook" and
       "sheet"; a czytnik is the reader. Each of these is the whole of what a person can do
       about the file, so each ends with what to do rather than with what went wrong. */
    "this file is an old .xls workbook or a password-protected one, which are both a different format from .xlsx; open it, save a copy as .xlsx without a password, and import that":
      "ten plik to stary skoroszyt .xls albo skoroszyt chroniony hasłem, a oba mają inny format"
      + " niż .xlsx; wystarczy otworzyć go, zapisać kopię jako .xlsx bez hasła i zaimportować tę"
      + " kopię",
    "this file is not a workbook: a .xlsx is a zip and this does not begin like one":
      "ten plik nie jest skoroszytem: .xlsx to archiwum zip, a ten plik nie zaczyna się jak"
      + " archiwum",
    "this file is a zip but not a workbook: it has no xl/workbook.xml in it":
      "ten plik to archiwum zip, ale nie skoroszyt: nie ma w nim xl/workbook.xml",
    "this workbook is in the zip64 format, which this reader does not read":
      "ten skoroszyt jest w formacie zip64, którego ten czytnik nie odczytuje",
    "this workbook unpacks to more than {MB} MB, which this reader does not read":
      "ten skoroszyt po rozpakowaniu zajmuje ponad {MB} MB, czego ten czytnik nie odczytuje",
    "this workbook's directory is damaged and it cannot be opened":
      "katalog tego skoroszytu jest uszkodzony i nie da się go otworzyć",
    "this workbook's entry {NAME} is damaged and it cannot be opened":
      "wpis {NAME} w tym skoroszycie jest uszkodzony i nie da się go otworzyć",
    "this workbook's entry {NAME} is packed by a method this reader does not read (method {METHOD})":
      "wpis {NAME} w tym skoroszycie jest spakowany metodą, której ten czytnik nie odczytuje"
      + " (metoda {METHOD})",
    "this workbook is password-protected; open it, save a copy without the password and import that":
      "ten skoroszyt jest chroniony hasłem; wystarczy otworzyć go, zapisać kopię bez hasła i"
      + " zaimportować tę kopię",
    "this workbook declares no sheet at all": "ten skoroszyt nie deklaruje żadnego arkusza",
    "this sheet's used rectangle is {ROWS} rows by {COLUMNS} columns, {CELLS} cells, and this reader builds at most {BUDGET}; a cell far from the others makes the whole rectangle, so move that cell nearer and import again":
      "użyty prostokąt tego arkusza to {ROWS} wierszy na {COLUMNS} kolumn, {CELLS} komórek, a ten"
      + " czytnik buduje najwyżej {BUDGET}; komórka daleko od pozostałych rozciąga cały prostokąt,"
      + " więc wystarczy przysunąć ją bliżej i zaimportować jeszcze raz",
    "this workbook has an unclosed {TAG}, so it was not read; save the workbook again from the spreadsheet and import that copy":
      "ten skoroszyt ma niedomknięty znacznik {TAG}, więc nie został odczytany; wystarczy zapisać"
      + " go ponownie w arkuszu kalkulacyjnym i zaimportować tę kopię",
    "this workbook has more than {BUDGET} cells in one part, which this reader does not read; split it and import the parts":
      "ten skoroszyt ma w jednej części ponad {BUDGET} komórek, czego ten czytnik nie odczytuje;"
      + " wystarczy podzielić go i zaimportować części",
    "this JSON file is none of the exports Studio reads: a list of macros, of folders of responses, or of templates":
      "ten plik JSON nie jest żadnym z eksportów, które Studio czyta: listą makr, folderów"
      + " odpowiedzi ani szablonów",
    "this export could not be read: it has no {FIELD} where one is needed":
      "tego eksportu nie da się odczytać: brakuje w nim pola {FIELD} tam, gdzie jest potrzebne",
    "the CSV has no rows at all": "plik CSV nie ma żadnych wierszy",
    /* Placeholder, polish 04 item 7: the copywriter's to replace. */
    "No column holds text in the primary language, {CODE}. Choose the column that holds it, or give a column that language, in the table of headings":
      "Żadna kolumna nie zawiera tekstu w języku głównym ({CODE}). W tabeli nagłówków można"
      + " wskazać kolumnę z tym tekstem albo nadać kolumnie ten język",
    "{ROWS} is {PAIRS}, past this rule's stated ceiling of {N}; a pile this size needs a blocking index rather than a longer wait":
      "{ROWS} to {PAIRS}, powyżej ustalonego w tej regule limitu {N}; taka sterta potrzebuje"
      + " indeksu blokującego, a nie dłuższego czekania",

    /* The proposals. The engine becomes Etiuda: silnik is our word for it, and the person at the
       desk knows the program by its name. */
    /* THE REFUSAL FOR A FILE FROM ANOTHER CATALOG IS GONE (board 539, Maxim 2026-09-19
       05:23): such a file is now a proposal of a different kind rather than a mistake, and
       what the queue says about it is a note at its head, not a refusal. What is left is the
       file that says nothing about what it is at all. */
    "this file does not say which catalog it belongs to, so there is nothing to review it against. A file exported from a desk, or made by Studio's import, always says; exporting it again from the desk is enough.":
      "ten plik nie mówi, do którego katalogu należy, więc nie ma go z czym porównać. Plik"
      + " wyeksportowany ze stanowiska albo utworzony przez import w Studiu zawsze to mówi;"
      + " wystarczy ponownie wyeksportować go ze stanowiska.",
    /* Polish 03, item 8: a file in the inbox that is not a catalog at all. Placeholder Polish
       for the copywriter. */
    "this is not a catalog file, so there is nothing in it to review":
      "to nie jest plik katalogu, więc nie ma w nim nic do przejrzenia",
    "this file carries a key named {KEY}, which no catalog or statistics file has, so it is not read":
      "ten plik ma klucz o nazwie {KEY}, jakiego nie ma żaden katalog ani plik statystyk, więc"
      + " nie jest czytany",
    "this file nests deeper than any catalog or statistics file does, so it is not read":
      "ten plik jest zagnieżdżony głębiej niż jakikolwiek katalog czy plik statystyk, więc nie"
      + " jest czytany",
    /* THE FIVE NOTES THE QUEUE SAYS ABOUT A FILE IT ACCEPTED (539's tail). A note is not a
       refusal - nothing was stopped - and it is painted at the head of the same screen, four
       lines of English under a Polish heading until these pairs existed. Every number in them
       is a bare numeral rather than a counted noun, so each stands after a preposition that
       governs one form and nothing has to agree with anything. */
    "this file is from a different catalog: it says id {THEIRS} and this catalog is {OURS}, so every row below is a card, an intent or a category coming IN. Nothing it leaves out is offered for removal and nothing about the catalog's own name or languages is offered at all":
      "ten plik pochodzi z innego katalogu: ma id {THEIRS}, a ten katalog to {OURS}, więc każdy wiersz poniżej to karta, intencja albo kategoria przychodząca z tego pliku. Niczego, czego w pliku nie ma, nie proponuje się do usunięcia, a nazwa i języki katalogu zostają bez zmian",
    "imported here from {FILE}, so every row below is a card or a tag coming in from that file. Nothing it leaves out is offered for removal and nothing about the catalog's own name or languages is offered at all":
      "import z pliku {FILE}, więc każdy wiersz poniżej to karta, intencja albo kategoria"
      + " przychodząca z tego pliku. Niczego, czego w pliku nie ma, nie proponuje się do"
      + " usunięcia, a nazwa i języki katalogu zostają bez zmian",
    "it does not carry modified: true, so it is not an engine export: it is a document built somewhere else":
      "nie ma w nim modified: true, więc nie pochodzi z eksportu z Etiudy: to dokument"
      + " zbudowany gdzie indziej",
    "the proposal does not carry modified: true, so it was not written by an engine export of this catalog; its id says it is this catalog all the same":
      "propozycja nie ma modified: true, więc nie zapisał jej eksport tego katalogu z Etiudy;"
      + " jej id mówi mimo to, że to ten sam katalog",
    /* Wersja rather than rewizja: the archive's rows have said wersja since board 479 and a
       second word for one thing would read as a second thing. */
    "{ROWS} changed here as well since the copy this file was made from, so look at each such row before accepting it":
      "zmienione również w szkicu od czasu kopii, z której powstał ten plik: {ROWS};"
      + " każdy taki wiersz warto obejrzeć przed przyjęciem",
    "nothing here shows which copy this file was made from, so {ROWS} may undo a change made here; look at each such row before accepting it":
      "nic tutaj nie wskazuje, z jakiej kopii powstał ten plik, więc wiersz może cofać zmianę"
      + " zrobioną w szkicu. Do obejrzenia przed przyjęciem: {ROWS}",
    "the proposal was made against rev {THEIRS} and the working copy is at rev {OURS}, so its author had not seen the later rev":
      "propozycja powstała na podstawie wersji {THEIRS}, a szkic jest już w wersji {OURS}, więc"
      + " jej autor nie widział nowszej",
    "the proposal claims rev {THEIRS}, ahead of this catalog's {OURS}; only the origin bumps rev, so this file has been through another publisher":
      "propozycja podaje wersję {THEIRS}, wyżej niż {OURS} w tym katalogu; numer wersji podnosi tylko źródło, więc ten plik przeszedł przez innego wydawcę",

    "there is no catalog at {DIR}, so an import cannot land in it":
      "pod ścieżką {DIR} nie ma katalogu, więc import nie ma gdzie trafić",
    "there is already a file at {DIR} with {ROWS} still waiting; an import never writes over a proposal that is waiting":
      "pod ścieżką {DIR} jest już plik, a w nim nierozstrzygnięte wiersze: {ROWS}; import nigdy"
      + " nie nadpisuje propozycji, która czeka",
    /* Two labels rather than one clause: would have been accepted cannot be said of a Polish
       count in one clause, because the verb agrees with the number. */
    "a decision has to be attributable: write whose proposal this is. {ACCEPTED} would have been accepted and {REJECTED} rejected, and nothing was written.":
      "każda decyzja musi mieć autora: trzeba wpisać, czyja to propozycja. Do przyjęcia:"
      + " {ACCEPTED}. Do odrzucenia: {REJECTED}. Nic nie zostało zapisane.",

    /* THE TEXT IMPORT (602, 604, 639). A count in any of these stands
       as a bare quantity after a comma or behind a colon and never after a preposition: the
       phrase the table hands back is nominative and can stand nowhere else (src/refusal.mjs).
       The English frames were shaped for that rule rather than translated around it. */
    "the file is empty, so there is nothing to import":
      "plik jest pusty, więc nie ma czego importować",
    "the provider's answer is not the JSON this import asked for, so nothing could be read out of it: {CHARS}":
      "odpowiedź dostawcy nie jest formatem JSON, o który prosił ten import, więc nic nie dało"
      + " się z niej odczytać: {CHARS}",
    "nothing usable came back, so there is nothing to propose: {CALLS}":
      "nie wróciło nic, czego dałoby się użyć, więc nie ma czego zaproponować: {CALLS}",
    "nothing in the answer survived the check that every proposed span is in the file it came from, so no proposal was written":
      "nic z odpowiedzi nie przeszło sprawdzenia, czy każdy proponowany fragment jest w pliku,"
      + " z którego pochodzi, więc nie zapisano żadnej propozycji",

    /* THE CUSTOMER'S OWN AI SERVICE (board 992, src/customer-ai.mjs). The Polish is the copywriter's pass of 2026-11-11
       (office brief words-992-own-ai-2026-11-11, "The 16 refusals"), every line impersonal. Six of her English lines change
       too (none, model, key, busy, managed, keyAway); their English lives in src/customer-ai.mjs's SAID, and each key here
       moved with it when that file took her English, at 992's fold. */
    "No AI service is set up yet. One is chosen from the Menu, under Settings, then AI service.":
      "Usługa AI nie jest jeszcze ustawiona. Wybiera się ją z menu, w Ustawieniach, w części Usługa AI.",
    "The AI service named in the settings is not one Studio knows, so nothing was sent: {NAME}":
      "Studio nie zna usługi AI wskazanej w ustawieniach, więc nic nie zostało wysłane: {NAME}",
    "The AI service's address must be a full https address with no user name, query or fragment, so nothing was sent: {URL}":
      "Adres usługi AI musi być pełnym adresem https, bez nazwy użytkownika, zapytania i fragmentu, więc nic nie zostało"
      + " wysłane: {URL}",
    "No model is named for the AI service, so nothing was sent. The model is named from the Menu, under Settings, then AI service.":
      "Dla usługi AI nie wskazano modelu, więc nic nie zostało wysłane. Model wskazuje się z menu, w Ustawieniach, w części"
      + " Usługa AI.",
    "The AI service could not be reached: {WHY}":
      "Nie udało się połączyć z usługą AI: {WHY}",
    "The AI service did not answer in time, so the request was given up.":
      "Usługa AI nie odpowiedziała na czas, więc zapytanie przerwano.",
    "The AI service did not accept the key it was given, status {STATUS}. The key is checked from the Menu, under Settings, then AI service.":
      "Usługa AI nie przyjęła podanego klucza, kod {STATUS}. Klucz sprawdza się z menu, w Ustawieniach, w części Usługa AI.",
    "The AI service is busy and asked Studio to wait; a later try may go through.":
      "Usługa AI jest zajęta i poprosiła Studio o odczekanie; późniejsza próba może się udać.",
    "The AI service answered with an error, status {STATUS}: {WHY}":
      "Usługa AI odpowiedziała błędem, kod {STATUS}: {WHY}",
    "The AI service's answer was larger than Studio reads, so it was set aside.":
      "Odpowiedź usługi AI była większa, niż Studio odczytuje, więc została pominięta.",
    "The AI service's answer held no text Studio could read.":
      "W odpowiedzi usługi AI nie było tekstu, który Studio mogłoby odczytać.",
    "The AI service stopped its answer early, at the length it allows: {CHARS}":
      "Usługa AI urwała odpowiedź przed końcem, na długości, na jaką pozwala: {CHARS}",
    "The AI service is set by the organisation's Group Policy, so this setting cannot be changed here.":
      "Usługę AI ustawiono w zasadach grupy organizacji, więc tego ustawienia nie można tu zmienić.",
    "This computer cannot keep the AI service's key for this account: no keyring is open to seal it, so the key was not kept.":
      "Na tym komputerze nie da się przechować klucza usługi AI dla tego konta: żaden magazyn kluczy nie jest otwarty, by go"
      + " zapieczętować, więc klucz nie został zachowany.",
    "Group Policy names an AI service setting Studio cannot use, so it is ignored: {NAME}":
      "Zasady grupy ustawiają dla usługi AI wartość, której Studio nie może użyć, więc zostaje pominięta: {NAME}",
    "The organisation's Group Policy sets the AI service's key, and that key goes only to the address the policy sets or to the service's own, never to an address typed here, so nothing was sent.":
      "Klucz usługi AI ustawiono w zasadach grupy organizacji, a ten klucz trafia tylko pod adres z tych zasad albo pod"
      + " własny adres usługi, nigdy pod adres wpisany tutaj, więc nic nie zostało wysłane.",
    "Not sent: the organisation set a key without naming its service.":
      "Nie wysłano: organizacja ustawiła klucz bez wskazania usługi.",

    /* Settings, AI service (board 992, stage 3): the copywriter's words of 2026-11-11, words-992-own-ai-2026-11-11.md in the
       office. The vendors' names are their own and stand outside the table. */
    "AI service": "Usługa AI",
    "Studio can use an AI service of the organisation's choosing to bring in old replies, draft a card's other language, or draft a new card from a short description. Nothing is sent until the lead starts a job and presses Send, and then only to the address below.":
      "Studio może korzystać z usługi AI wybranej przez organizację, by wczytywać dawne odpowiedzi, szkicować drugi język karty albo nową kartę z krótkiego opisu. Nic nie jest wysyłane, dopóki lider zespołu nie rozpocznie zadania i nie naciśnie Wyślij, a wtedy tylko pod adres podany niżej.",
    "No service is set, so Studio sends nothing anywhere.": "Nie ustawiono żadnej usługi, więc Studio niczego nigdzie nie wysyła.",
    "Service": "Usługa",
    "None": "Brak",
    "Another OpenAI-compatible service": "Usługa zgodna z OpenAI",
    "Address": "Adres",
    "Left empty, the service's own address is used: {URL}": "Puste pole oznacza własny adres usługi: {URL}",
    "Needed for this service: the full https address the organisation gives for it.":
      "Wymagany dla tej usługi: pełny adres https, który podaje dla niej organizacja.",
    "Model": "Model",
    "The model's name exactly as the service lists it.": "Nazwa modelu dokładnie taka, jak podaje ją usługa.",
    "Kept on this computer, sealed by the system for this account, and never written to a log.":
      "Przechowywany na tym komputerze, zapieczętowany przez system dla tego konta i nigdy niezapisywany w dzienniku.",
    "A key is kept. Typing a new one replaces it.": "Klucz jest zachowany. Wpisanie nowego go zastępuje.",
    "The key kept here was given for the previous service or address, so it was forgotten rather than sent to this one. A key for this one goes in the Key field.":
      "Zachowany klucz podano dla poprzedniej usługi lub adresu, więc został usunięty, zamiast trafić pod nowy. Klucz dla nowego wpisuje się w polu Klucz.",
    "Set by the organisation in Group Policy, where every user of this computer can read it.":
      "Ustawiony przez organizację w zasadach grupy, gdzie może go odczytać każdy użytkownik tego komputera.",
    "Forget the key": "Usuń klucz",
    "Removes the AI service's key kept on this computer. Nothing is sent.": "Usuwa klucz usługi AI przechowywany na tym komputerze. Nic nie jest wysyłane.",
    "Key forgotten": "Usunięto klucz",
    "Test the connection": "Sprawdź połączenie",
    "Asks the model for a one-word answer. No catalog text is sent.":
      "Prosi model o odpowiedź jednym słowem. Żaden tekst z katalogu nie jest wysyłany.",
    "Testing…": "Sprawdzanie…",
    "Connected: {HOST} answered, model {MODEL}.": "Połączono: {HOST} odpowiada, model {MODEL}.",
    "What a job sends goes to {HOST} and nowhere else.": "To, co wysyła zadanie, trafia do {HOST} i nigdzie indziej.",
    "Your organisation has set a key for an AI service without naming the service, so nothing is sent. Its IT department can name it.":
      "Organizacja ustawiła klucz do usługi AI, ale nie wskazała tej usługi, więc nic nie jest wysyłane. Może ją wskazać dział IT organizacji.",
    "Set by the organisation": "Ustawione przez organizację",
    "Whoever manages Etiuda for the organisation can change this.": "Zmienić to może osoba, która zarządza Etiudą w organizacji.",

    /* The drafting jobs (board 992, stage 4): the copywriter's words of 2026-11-11, the same brief, Stage 4. The Polish send
       lines put the count after a colon, as {N}, so "przykłady" never has to agree with it; the English counts {CARDS}. */
    "Draft with the organisation's model": "Szkic przez model organizacji",
    "What happened, and what does the team do about it?": "Co się stało i co zespół z tym robi?",
    "Sends this card ({CHARS}) to {HOST}, model {MODEL}, with {CARDS} already written in that language as examples.":
      "Do {HOST}, model {MODEL}, trafi ta karta ({CHARS}), a jako przykłady karty już napisane w tym języku: {N}.",
    "Sends the description ({CHARS}), {CARDS} from {CATEGORY} as examples, and the names of the categories and intents to {HOST}, model {MODEL}.":
      "Do {HOST}, model {MODEL}, trafi opis ({CHARS}), nazwy kategorii i intencji, a jako przykłady karty z kategorii {CATEGORY}: {N}.",
    "Send": "Wyślij",
    "Drafting…": "Szkicowanie…",
    /* Job 1, bringing in old replies (the copywriter's words of 2026-11-11, 226f2d3ce in the office). */
    "Split with the organisation's model": "Podział przez model organizacji",
    "Sends this text ({CHARS}) and the names of the categories and intents to {HOST}, model {MODEL}.":
      "Do {HOST}, model {MODEL}, trafi ten tekst ({CHARS}) oraz nazwy kategorii i intencji.",
    "Sends the text of {FILE} ({CHARS}) and the names of the categories and intents to {HOST}, model {MODEL}.":
      "Do {HOST}, model {MODEL}, trafi tekst pliku {FILE} ({CHARS}) oraz nazwy kategorii i intencji.",
    "Splitting…": "Dzielenie…",
    "Sends this text ({CHARS}), in {PARTS}, and the names of the categories and intents to {HOST}, model {MODEL}.":
      "Do {HOST}, model {MODEL}, trafi ten tekst ({CHARS}), podzielony na części: {N}, oraz nazwy kategorii i intencji.",
    "Sends the text of {FILE} ({CHARS}), in {PARTS}, and the names of the categories and intents to {HOST}, model {MODEL}.":
      "Do {HOST}, model {MODEL}, trafi tekst pliku {FILE} ({CHARS}), podzielony na części: {N}, oraz nazwy kategorii i intencji.",
    "Splitting… part {N} of {TOTAL}": "Dzielenie… część {N} z {TOTAL}",
    "{N} of {TOTAL} parts were sent before Cancel; the rest were not. Their cards are in the review queue.":
      "Przed anulowaniem wysłano części: {N} z {TOTAL}; pozostałych nie wysłano. Karty z nich są w kolejce do przeglądu.",
    "This text is {CHARS}, and one import carries at most {MAX}, so nothing was sent. A shorter part of it can be brought in instead, or the whole of it split with Split into cards, which sends nothing.":
      "Ten tekst ma {CHARS}, a jeden import obejmuje najwyżej {MAX}, więc nic nie zostało wysłane. Zamiast tego można wczytać jego krótszą część albo podzielić całość przyciskiem Podziel na karty, który niczego nie wysyła.",
    "the draft is no longer waiting, so nothing was accepted": "szkic już nie czeka na przyjęcie, więc niczego nie przyjęto",
    "the draft's text is empty, so nothing was accepted": "tekst szkicu jest pusty, więc niczego nie przyjęto",
    "the card now holds steps or alternatives, and a draft is a single text, so nothing was accepted":
      "karta ma teraz kroki albo warianty, a szkic jest jednym tekstem, więc niczego nie przyjęto",
    "model": "model",
    "other language": "drugi język",
    "new card": "nowa karta",
    "no source: written by the model": "bez źródła: napisane przez model",
    "Written by the model, not yet accepted": "Napisane przez model, jeszcze nie przyjęte",
    "Drafts waiting to be accepted, not in this edition: {N}": "Szkice czekające na przyjęcie, poza tym wydaniem: {N}",
    "Could not reach {HOST}, so nothing was drafted.": "Nie udało się połączyć z {HOST}, więc nic nie powstało.",
    "{HOST} did not accept the key, so nothing was drafted.": "{HOST} nie przyjął klucza, więc nic nie powstało.",
    "{HOST} is busy and asked for a pause, so nothing was drafted.": "{HOST} jest zajęty i poprosił o przerwę, więc nic nie powstało.",
    "No answer came in time. The text was sent; nothing was added.": "Odpowiedź nie nadeszła na czas. Tekst został wysłany; nic nie dodano.",
    "The answer could not be used. Nothing was added.": "Odpowiedzi nie dało się wykorzystać. Nic nie dodano.",
    "{HOST} answered with an error, so nothing was drafted.": "{HOST} odpowiedział błędem, więc nic nie powstało.",
    "The connection to {HOST} broke before an answer came, so nothing was drafted.":
      "Połączenie z {HOST} zerwało się przed nadejściem odpowiedzi, więc nic nie powstało.",
    "What would be sent changed after the line was shown, so nothing was sent. Ask for a new line before sending.":
      "To, co miałoby zostać wysłane, zmieniło się po pokazaniu linii, więc nic nie zostało wysłane. Przed wysłaniem trzeba pobrać nową linię.",
    "Sends the description ({CHARS}) and the names of the categories and intents to {HOST}, model {MODEL}.":
      "Do {HOST}, model {MODEL}, trafi opis ({CHARS}) oraz nazwy kategorii i intencji.",
    "Open Settings": "Otwórz Ustawienia",

    /* The counted nouns the refusals need beyond the screens' own. */
    "{N} problem": "{N} problem",
    "{N} problems": "{N} problemów",
    "{N} unexpected difference": "{N} nieoczekiwana różnica",
    "{N} unexpected differences": "{N} nieoczekiwanych różnic",
    "{N} pair": "{N} para",
    "{N} pairs": "{N} par",
    "{N} ask": "{N} zapytanie",
    "{N} asks": "{N} zapytań",
    "{N} character": "{N} znak",
    "{N} characters": "{N} znaków",

    /* The frames. A frame holds the order and the words between the counts, never the counts
       themselves, so a language whose sentence wants another shape says so in one place. */
    "{CARDS}. {FINDINGS}, unfixed since the last publish.":
      "{CARDS}. {FINDINGS}, bez poprawek od ostatniej publikacji.",
    "{CARDS}. {FINDINGS}.": "{CARDS}. {FINDINGS}.",
    "{ERRORS}, {WARNINGS}": "{ERRORS}, {WARNINGS}",
    "{REVS} kept so far.": "W archiwum: {REVS}.",

    /* THE AUDIT PACK'S SCREEN AND THE FOLDER IT WRITES (board 606, 2026-09-20). Every pair below
       is Claudius's draft rather than the copywriter's, as the review queue's five notes were on
       board 631, and the whole block is hers to correct: this seat writes Polish only so that a
       screen is not held English by a word nobody has been asked for yet. Her pass of board 744
       read it and rewrote four.

       FOUR OF THEM AGREE WITH A FEMININE NOUN RATHER THAN WITH NOTHING, which is the opposite of
       the queue's chips (539): a chip there agrees with no noun at all and went to the neuter
       plural, while a cell in this table is about ONE CARD and karta is feminine, so przyjeta
       rather than przyjete. The five tile labels count cards and are plural for the same reason.

       THE FOUR LONG ONES ARE INDIRECT KEYS AND ARE WRITTEN ON ONE LINE EACH. The account
       statement is src/review.mjs's single statement of what a name is worth and the three limits
       are src/audit.mjs's LIMITS; they arrive on the pack rather than as a literal in ui/app.js,
       and tests/polish.mjs declares them in 5b by importing them rather than by retyping them.
       A key built by joining two string literals would be invisible to that file's own regex over
       this one, so neither half of any pair below is broken across a line. */
    "Audit": "Audyt",

    /* The desks asking to join (board 834, step 12, S5): the engineer's Polish, standing in until the copywriter's pass. */
    "A teammate": "Członek zespołu",
    "asked {WHEN}": "prośba z {WHEN}",
    "Refuse": "Odmów",
    "Open this request again.": "Tę prośbę trzeba otworzyć ponownie.",
    "{NAME} is off the team. One catalog, {FILE}, has not yet been sealed again for the team as it now stands. Studio tries again each time it checks the team's folder, and at its next start, so it finishes by itself while Studio is open.": "{NAME} nie jest już członkiem zespołu. Jeden katalog, plik {FILE}, nie został jeszcze ponownie zapieczętowany dla zespołu w nowym składzie. Studio ponawia próbę przy każdym sprawdzeniu folderu zespołu i przy następnym uruchomieniu, więc dokończy to samo, gdy będzie otwarte.",
    /* Removing a member, forward only, in the copywriter's words (2026-10-13). */
    "Remove {NAME} from the team": "Usunięcie z zespołu: {NAME}",
    "Removal works only from now on: {NAME} keeps the editions already received and gets no new ones.": "Usunięcie działa tylko na przyszłość: {NAME} zachowuje otrzymane już wydania, ale nie dostanie żadnego nowego.",
    /* On a plain team, drafted by the lead engineer's seat for the copywriter (sense pass finding 4). */
    /* What Remove will do (decision 27), in the copywriter's words (words-27-remove-confirmation-2026-11-12.md). */
    "That desk is not signed in, so only it leaves the team.": "To stanowisko nie jest zalogowane, więc zespół opuści tylko ono.",
    "This teammate holds a lead seat on the licence, so they stay on the team. Only the licence's owner can remove a lead from a team.":
      "Ta osoba ma w licencji miejsce lidera, więc zostaje w zespole. Lidera może usunąć z zespołu tylko osoba, do której należy licencja.",
    "{NAME} leaves the team on all their computers in it at once. Computers leaving: {N}.": "{NAME} opuści zespół naraz na wszystkich swoich komputerach, które do niego należą. Komputery, które go opuszczą: {N}.",
    "{NAME} leaves the team on their one computer in it.": "{NAME} opuści zespół na jedynym swoim komputerze, który do niego należy.",
    "{NAME} is in none of this Studio's other teams, so your admission of them to the licence is withdrawn too, until you admit them again.": "{NAME} nie należy do żadnego innego zespołu tego Studia, więc przyjęcie tej osoby do licencji też zostanie wycofane, do czasu ponownego przyjęcia.",
    "{NAME} is still in another of this Studio's teams, so your admission of them to the licence stays.": "{NAME} należy jeszcze do innego zespołu tego Studia, więc przyjęcie tej osoby do licencji zostaje.",
    "{NAME}'s lead seat on the licence is freed too.": "Zwolnione zostanie też miejsce lidera, które {NAME} ma w licencji.",
    /* Board 1017's B, Claude alpha's condition 2 (2026-11-22): the copywriter's words. */
    "{NAME} is taken off this team only, wherever you lead it from; their place in their other team stays. They come back to this team only by joining it again or by your admitting them.":
      "Usunięcie dotyczy tylko tego zespołu, niezależnie od komputera, z którego jest prowadzony; miejsce tej osoby w innym zespole zostaje. {NAME} wraca do tego zespołu tylko po ponownym dołączeniu albo po ponownym przyjęciu.",
    /* Hydrogen's review of 2026-11-12, finding 4 (a) and (c): the engineer's words, placeholder: Claudette. */
    "{NAME} holds a seat through their organisation or another lead, not your admission, so the seat stays and they can still sign in. They leave this team, and return to it only if you admit them again.":
      "{NAME} ma miejsce w licencji dzięki swojej organizacji albo innemu liderowi, a nie przyjęciu przez to Studio, więc miejsce zostaje, a logowanie nadal działa. {NAME} opuści ten zespół i wróci do niego tylko po ponownym przyjęciu.",
    "Signed out here. The licence service could not be told yet, so new computers on this licence may still find this Studio's relay teams until Studio next reaches it.":
      "Wylogowano na tym komputerze. Usługi licencji nie udało się jeszcze powiadomić, więc nowe komputery w tej licencji mogą nadal znajdować zespoły tego Studia na przekaźniku, dopóki Studio znów się z nią nie połączy.",
    "{NAME} is no longer on the team.": "{NAME} nie jest już w zespole.",
    /* Tau 2 of the Grok review of 2026-11-22: a Remove that took some of the person's computers off and not all. The copywriter's
       words. */
    "This teammate is still on the team: some of their computers could not be taken off. Still on the team: {N}. Remove tries them again.":
      "Ta osoba nadal jest w zespole: nie udało się odłączyć części jej komputerów. Nadal w zespole: {N}. Przycisk Usuń spróbuje ponownie.",
    "Studio is offline, so the statistics may leave out what this teammate sent since Studio last caught up with it.": "Studio nie ma połączenia, więc w statystykach może zabraknąć tego, co przyszło od tego członka zespołu, odkąd Studio ostatnio pobrało jego dane.",
    "Nobody was removed, as the removal was not confirmed.": "Nikogo nie usunięto, bo usunięcie nie zostało potwierdzone.",
    "This folder holds a different team, so nobody was removed.": "W tym folderze jest inny zespół, więc nikogo nie usunięto.",
    "This member is not on the team's list, so nothing changed.": "Tego członka nie ma na liście zespołu, więc nic się nie zmieniło.",
    "This Studio does not hold the team's current key, so nobody was removed.": "To Studio nie ma bieżącego klucza zespołu, więc nikogo nie usunięto.",
    "A file sealed for the team does not open with the key this Studio holds, so nobody was removed.": "Plik zapieczętowany dla zespołu nie otwiera się kluczem, który ma to Studio, więc nikogo nie usunięto.",
    "there is no team here led from this Studio, so there is nobody to remove": "tu nie ma zespołu prowadzonego z tego Studia, więc nie ma kogo usunąć",
    /* Invitations, automatic joining and the two lists (board 885, S2), in the copywriter's final words of 2026-10-13
       (state/drafts/copywriter-2026-10-13-s2-team-invite.md in the office's record); her row 17 is not here, as no screen
       says it since a valid invitation joins with no press. */
    "Asking to join": "Prośby o dołączenie",
    "Nobody is asking to join.": "Nikt nie prosi o dołączenie.",
    "Members": "Członkowie",
    "Studio": "Studio",
    "{KIND}, {DOOR}": "{KIND}, {DOOR}",
    "by invitation": "z zaproszenia",
    "joined automatically": "dołączyło samoczynnie",
    "by request in the folder": "z prośby w folderze",
    "Its invitation checks out.": "Zaproszenie się zgadza.",
    "Joins by itself once this Studio's signing key opens.": "Dołączy samo, gdy otworzy się klucz podpisu tego Studia.",
    "The proof in this request was not made with its invitation.": "Dowód w prośbie nie pochodzi z tego zaproszenia.",
    "Its invitation has already let a teammate in.": "To zaproszenie wpuściło już jednego członka zespołu.",
    "Its invitation was withdrawn.": "To zaproszenie zostało wycofane.",
    "Its invitation has expired.": "To zaproszenie wygasło.",
    "Its invitation is for another team.": "To zaproszenie dotyczy innego zespołu.",
    "This Studio made no such invitation.": "To Studio nie wystawiło takiego zaproszenia.",
    "Invitations": "Zaproszenia",
    "Invite a teammate…": "Zaproś członka zespołu…",
    "Copy": "Kopiuj",
    "Off": "Wyłączone",
    "On": "Włączone",
    /* Claudette's words, 2026-10-27 */
    "On the relay a teammate joins only with an invitation. It is let in by itself once this Studio sees its request; a request without an invitation is never let in.":
      "Przez przekaźnik do zespołu dołącza się tylko z zaproszeniem. Wpuszczenie następuje samo, gdy to Studio zobaczy prośbę; prośba bez zaproszenia nigdy nie zostanie przyjęta.",
    "Invite a teammate": "Zaproś członka zespołu",
    "Studio puts the invitation on the clipboard for you to send through your organisation's own mail or chat. Studio itself sends nothing.": "Studio skopiuje zaproszenie do schowka, żeby można je było wysłać pocztą lub czatem organizacji. Samo Studio niczego nie wysyła.",
    "Your name, as the desk will show it": "Imię i nazwisko lidera, tak jak pokaże je stanowisko",
    "Make the invitation": "Utwórz zaproszenie",
    /* The invitation's two copies, on a relay team's row and after each. In the copywriter's final wording of 2026-10-20. */
    "Copy link": "Kopiuj odnośnik",
    "Copy as text": "Kopiuj jako tekst",
    "The invitation is on the clipboard as text, to be pasted in Etiuda.": "Zaproszenie jest w schowku jako tekst, do wklejenia w Etiudzie.", /* plant:s3-pl-note */
    /* Slice 3, the person's name and the relay's row. In the copywriter's final wording of 2026-10-19. */
    "Name of the person invited": "Imię i nazwisko zapraszanej osoby",
    "Made {WHEN}": "Wystawione {WHEN}",
    "Valid until {WHEN}": "Ważne do {WHEN}",
    "The relay says this invitation has not been used yet.": "Według przekaźnika to zaproszenie nie zostało jeszcze użyte.",
    "The relay says it was first used at {WHEN}.": "Według przekaźnika pierwsze użycie: {WHEN}.",
    /* Claudette's words, 2026-10-27. */
    "The teammate that used it took its request back. No other teammate can use this invitation, and that one may not be able to either; a new one is the sure way in.": "Członek zespołu, który z niego skorzystał, wycofał prośbę. Nikt inny nie może skorzystać z tego zaproszenia, a on być może również nie; pewną drogą jest nowe zaproszenie.",
    "The teammate's own name: {NAME}.": "Nazwa podana przez członka zespołu: {NAME}.",
    "Each invitation lets one teammate in, until the time beside it.": "Każde zaproszenie wpuszcza jednego członka zespołu, do czasu podanego obok.",
    "The link is on the clipboard. Send it through your organisation's own mail or chat.": "Odnośnik jest w schowku; można go wysłać pocztą lub czatem organizacji.",
    /* Claudette's words, 2026-10-27 01:23. */
    "The link is copied. It reaches the relay shortly, usually within a minute, and a teammate can use it from then on.": "Odnośnik jest skopiowany. Wkrótce dotrze do przekaźnika, zwykle w ciągu minuty, i od tej chwili można z niego skorzystać.",
    /* Slice 3, cancelling an invitation. In the copywriter's final wording of 2026-10-19. */
    "Cancel this invitation": "Anuluj to zaproszenie",
    "Cancel this invitation?": "Anulować to zaproszenie?",
    "A teammate has already opened it and holds the team's key. Cancelling moves the whole team to a new key; every other teammate carries on, and nothing is asked of anyone.": "Członek zespołu już je otworzył i ma klucz zespołu. Anulowanie przeniesie cały zespół na nowy klucz; pozostali pracują dalej i nikt nie musi nic robić.",
    "Move the team to a new key": "Przenieś zespół na nowy klucz",
    /* A tie on one invitation, Claudette, 2026-11-15. Both desks were first seen in the same pass, so neither was let in. */
    /* A second desk with an invitation already used, Claudette, 2026-11-15. The line stays until the lead dismisses it or the team moves to a new key. */
    "{DESK} tried to join at {WHEN} with an invitation that had already been used, and was refused.": "Stanowisko {DESK} próbowało dołączyć o {WHEN} z zaproszeniem, które zostało już użyte, i spotkało się z odmową.",
    "A desk tried to join at {WHEN} with an invitation that had already been used, and was refused.": "O {WHEN} jakieś stanowisko próbowało dołączyć z zaproszeniem, które zostało już użyte, i spotkało się z odmową.",
    "If you did not expect this, the invitation's text reached someone else, who may hold the team's key until the team moves to a new one. Move the team to a new key does that.": "Jeśli to niespodziewane, treść zaproszenia trafiła do kogoś innego, kto może mieć klucz zespołu, dopóki zespół nie przejdzie na nowy. Służy do tego Przenieś zespół na nowy klucz.",
    /* draft words: copywriter */
    "These open invitations will be sealed under the new key:": "Te otwarte zaproszenia zostaną zapieczętowane nowym kluczem:",
    "The invitation is cancelled; anyone who opens its link is told it has already been used.": "Zaproszenie anulowano; kto otworzy jego odnośnik, zobaczy, że zostało już użyte.",
    "This invitation has ended, so it was not cancelled.": "To zaproszenie jest już nieważne, więc go nie anulowano.",
    "The relay did not cancel that invitation, so nothing was changed.": "Przekaźnik nie anulował tego zaproszenia, więc nic nie zmieniono.",
    /* Board 922, a desk refused and the relay did not take the answer: Studio sends it when it next reaches the relay. A draft, the copywriter's to replace. */
    "The refusal stands. The relay did not take the answer, so Studio will send it when it next reaches the relay, and the teammate is told then.": "Odmowa pozostaje w mocy. Przekaźnik nie przyjął odpowiedzi, więc Studio wyśle ją, gdy następnym razem połączy się z przekaźnikiem, a członek zespołu dowie się o niej wtedy.",
    "The team was not moved to a new key, as the move was not confirmed.": "Zespołu nie przeniesiono na nowy klucz, bo przeniesienie nie zostało potwierdzone.",
    "there is no team here led from this Studio, so there was no team to move to a new key": "tu nie ma zespołu prowadzonego z tego Studia, więc nie było czego przenosić na nowy klucz",
    "This folder holds a different team, so it was not moved to a new key.": "W tym folderze jest inny zespół, więc nie przeniesiono go na nowy klucz.",
    /* The catalog a joined desk has loaded (board 890), in the copywriter's final wording of 2026-10-14. */
    "edition {E}, published here": "wydanie {E}, opublikowane tutaj",
    /* Board 902, the rev first and the date in parentheses after it. Drafts, the copywriter's to replace. */
    "rev {R}, published here": "wersja {R}, opublikowana tutaj",
    "changed at the desk, from rev {N}": "zmieniony na stanowisku, na podstawie wersji {N}",
    "another catalog: {TITLE}": "inny katalog: {TITLE}",
    /* Board 899, a copy that came back and does not open as a catalog, and why. Drafts, the copywriter's to replace. */
    "This teammate's copy came back, but Studio could not open it as a catalog file, so nothing was imported.":
      "Kopia od tego członka zespołu wróciła, ale Studio nie mogło otworzyć jej jako pliku katalogu, więc nic nie zaimportowano.",
    "What stopped it: {WHY}": "Powód: {WHY}",
    "it holds no card": "nie ma w niej żadnej karty",
    "another catalog": "inny katalog",
    "as of {WHEN}": "stan na {WHEN}",
    "Import as a new catalog": "Importuj jako nowy katalog",
    "Waiting for this teammate since {WHEN}; the copy comes once it is running.": "Oczekiwanie na tego członka zespołu od {WHEN}; kopia przyjdzie, gdy jego komputer będzie włączony.",
    "Withdraw the request": "Wycofaj prośbę",
    "This teammate now uses a different catalog.": "Ten członek zespołu używa już innego katalogu.",
    "The catalog was imported as a new one.": "Katalog zaimportowano jako nowy.",
    /* Working copies of catalogs the team does not list (board 962, stage 3), in the copywriter's words of 2026-11-04. */
    "Copies of unlisted catalogs on this desk": "Kopie katalogów spoza listy na tym stanowisku",
    "{TITLE}, rev {REV}, edition {EDITION}": "{TITLE}, wer. {REV}, wydanie {EDITION}",
    "{TITLE}, rev {REV}": "{TITLE}, wer. {REV}",
    "not proposed": "bez propozycji",
    "Makes a new catalog from this copy. Nothing that is already here changes, and the teammate is not told.": "Tworzy z tej kopii nowy katalog. Nic, co już tu jest, się nie zmienia, a członek zespołu nie dostaje powiadomienia.",
    "This desk keeps copies of unlisted catalogs, but they cannot be opened on this computer, so nothing of them is shown.": "To stanowisko przechowuje kopie katalogów spoza listy, ale na tym komputerze nie da się ich otworzyć, więc nic z nich nie jest pokazane.",
    "This copy can no longer be read here, so nothing was imported. The desk may have changed or withdrawn it since.": "Tej kopii nie da się już tutaj odczytać, więc nic nie zaimportowano. Stanowisko mogło ją od tego czasu zmienić albo wycofać.",
    "This Studio's signing key is not open, so no request was made.": "Klucz podpisu tego Studia nie jest otwarty, więc prośby nie wysłano.",
    "This teammate is not using a catalog this Studio can ask for.": "Ten członek zespołu nie używa katalogu, o który to Studio może poprosić.",
    "There is no team here led from this Studio, so no request was made.": "Tu nie ma zespołu prowadzonego z tego Studia, więc prośby nie wysłano.",
    "Studio could not open this teammate's catalog file, so which catalog it uses is not known.": "Studio nie mogło otworzyć pliku katalogu tego członka zespołu, więc nie wiadomo, którego katalogu używa.",
    "The copy that came back is not this teammate's, so it was not imported. Import can be asked for again.": "Kopia, która wróciła, nie pochodzi od tego członka zespołu, więc nie została zaimportowana. Można poprosić o nią ponownie.",
    "This teammate did not answer within 7 days, so the request lapsed. Import can be asked for again.": "Ten członek zespołu nie odpowiedział w ciągu 7 dni, więc prośba wygasła. Można poprosić o kopię ponownie.",
    "There is no team here led from this Studio, so nobody can be invited.": "Tu nie ma zespołu prowadzonego z tego Studia, więc nie można nikogo zaprosić.",
    "A desk would read {FOLDER} differently from how it is written here, so no invitation was made.": "Stanowisko odczytałoby ścieżkę {FOLDER} inaczej, niż jest tu zapisana, więc zaproszenia nie utworzono.",
    "This computer cannot keep an invitation sealed for the signed-in account, so none was made.": "Na tym komputerze nie da się przechować zapieczętowanego zaproszenia dla zalogowanego konta, więc go nie utworzono.",
    "This invitation has ended, so it was not copied.": "To zaproszenie jest już nieważne, więc go nie skopiowano.",
    "For your IT department": "Dla działu IT",
    "A Group Policy template carrying this team's lead key, so every desk it reaches trusts this lead and no other.": "Szablon zasad grupy z kluczem lidera tego zespołu: każde stanowisko, do którego trafi, ufa temu liderowi i żadnemu innemu.",
    "Save the template…": "Zapisz szablon…",
    "Copy the values": "Kopiuj wartości",
    "Where to save the Group Policy template": "Gdzie zapisać szablon zasad grupy",
    "The template is in {FOLDER}, laid out as a PolicyDefinitions folder holds it.": "Szablon jest w folderze {FOLDER}, ułożony tak jak w folderze PolicyDefinitions.",
    "This team's lead key is on the clipboard.": "Klucz lidera tego zespołu jest w schowku.",
    "There is no team here led from this Studio, so there is nothing to give the IT department.": "Tu nie ma zespołu prowadzonego z tego Studia, więc nie ma czego przekazać działowi IT.",
    "What this edition contains, how every card in it came to be there, and who decided.": "Co zawiera to wydanie, jak trafiła do niego każda karta i kto o tym zdecydował.",
    "Export this pack": "Eksportuj ten pakiet",
    "About the names below": "O nazwach poniżej",
    "This edition": "To wydanie",
    "Content hash": "Suma kontrolna treści",
    "recomputes over these bytes": "zgadza się z zawartością pliku",
    "DOES NOT recompute": "NIE zgadza się z zawartością pliku",
    "Signature": "Podpis",
    "Every card in edition {E}": "Każda karta w wydaniu {E}",
    "Every card in rev {R}": "Każda karta w wersji {R}",
    "Card": "Karta",
    "How it got here": "Jak tu trafiła",
    "Who decided": "Kto zdecydował",
    "When": "Kiedy",
    "accepted": "przyjęta",
    "written here": "napisana tutaj",
    "unchanged since {E}": "bez zmian od {E}",
    "unchanged since rev {R}": "bez zmian od wersji {R}",
    "unaccounted for": "nieudokumentowana",
    "published unsigned": "opublikowany bez podpisu",
    "verified against the key below": "zweryfikowany kluczem poniżej",
    "does not verify": "nie zgadza się",
    "there is no key on this computer to check it against":
      "na tym komputerze nie ma klucza, którym można go sprawdzić",
    "Cards in this edition": "Karty w tym wydaniu",
    "Accepted from a proposal": "Przyjęte z propozycji",
    "Written here by the owner": "Napisane tutaj przez właściciela",
    "Unchanged since an earlier edition": "Bez zmian od wcześniejszego wydania",
    "Unaccounted for": "Nieudokumentowane",
    "What this pack does not show": "Czego ten pakiet nie pokazuje",

    /* THE FIVE REFUSALS THE PACK CAN MEET, which section 7 of tests/polish.mjs holds to this
       table exactly as it holds every other frame the node half throws. They are lower case
       and begin mid-sentence because that is what src/refusal.mjs's callers write. */
    "an audit pack needs a folder to write": "pakiet audytu potrzebuje folderu do zapisu",
    "{P} already holds an audit pack; a pack is written into a folder of its own":
      "{P} zawiera już pakiet audytu; pakiet zapisuje się do własnego folderu",
    "there is no audit pack at {P}: a pack carries a {F}": "w {P} nie ma pakietu audytu: pakiet zawiera {F}",
    "an audit pack holds one catalog-<edition>.json and {P} holds {N}":
      "pakiet audytu zawiera jeden plik catalog-<wydanie>.json, a {P} zawiera {N}",
    "nothing has been published from {P} yet, so there is no edition to account for":
      "z {P} nic jeszcze nie opublikowano, więc nie ma wydania do rozliczenia",
    "Every name in this record is the account name the operating system reported for whoever was running Etiuda Studio when the decision was taken. It is not verified: this family of programs has no accounts and asks nobody to sign in, so the name shows which computer account decided and not which person sat at it.":
      "Każda nazwa w tym zapisie to nazwa konta, którą system operacyjny podał dla osoby uruchamiającej Etiuda Studio w chwili podjęcia decyzji. Nie jest zweryfikowana: ta rodzina programów nie ma kont i nikogo nie prosi o zalogowanie, więc nazwa wskazuje konto komputera, na którym zapadła decyzja, a nie osobę, która przy nim siedziała.",
    "A signature proves that this catalog came from the key named in this pack and has not changed since it was signed. It does not show who holds that key.":
      "Podpis dowodzi, że ten katalog pochodzi od klucza wskazanego w tym pakiecie i nie zmienił się od chwili podpisania. Nie pokazuje, kto ten klucz posiada.",
    "There is no trusted time source. Every time in this pack is the reading of the clock on the computer where the decision was taken or where the catalog was published.":
      "Nie ma zaufanego źródła czasu. Każda godzina w tym pakiecie to odczyt zegara komputera, na którym podjęto decyzję albo opublikowano katalog.",
    "Nothing in this pack is confirmed by a server, so it shows that the key named here signed, but not whether that key was later copied or replaced.":
      "Nic w tym pakiecie nie jest potwierdzane przez serwer, więc pakiet pokazuje, że podpis złożono wskazanym tu kluczem, ale nie to, czy ten klucz został później skopiowany albo zastąpiony.",

    /* Retire, restore, undo and history (board 834, step 6, C07): Claudia's sheet words where it has them
       (it says "biurko", the table "stanowisko"); where it has none the value is [PL pending] and the English. */
    "Active {N}": "Aktywne {N}",
    "Retired {N}": "Wycofane {N}",
    "All {N}": "Wszystkie {N}",
    "retired": "wycofana",
    /* The workbook's Status cell for a retired card (the copywriter, 436896c9). */
    "Retired": "Wycofana",
    "Retire": "Wycofaj",
    "Restore": "Przywróć",
    /* Board 902: the rev first, its date in parentheses in {R}. A draft, the copywriter's to replace. */
    "Retired in rev {R}. The desks keep it out of sight, together with its stars, own edits and counts, until it is restored.":
      "Wycofana w wersji {R}. Stanowiska chowają ją razem z gwiazdkami, własnymi zmianami i licznikami, aż do przywrócenia.",
    "Retired in edition {E}. The desks keep it out of sight, together with its stars, own edits and counts, until it is restored.":
      "Wycofana w wydaniu {E}. Stanowiska chowają ją razem z gwiazdkami, własnymi zmianami i licznikami, aż do przywrócenia.",
    "Retired in this draft. Once the draft is published, the desks keep it out of sight, together with its stars, own edits and counts, until it is restored.":
      "Wycofana w tym szkicu. Po publikacji stanowiska schowają ją razem z gwiazdkami, własnymi zmianami i licznikami, aż do przywrócenia.",
    "History": "Historia",
    "From the published editions in the archive, as far back as the first.":
      "Z opublikowanych wydań w archiwum, aż do pierwszego.",
    "added": "dodana",
    "title": "tytuł",
    "text": "treść",
    "restored":
      "przywrócona",
    "details":
      "szczegóły",
    "“{NOTE}”": "„{NOTE}”",
    "Compare": "Porównaj",
    "Restore this text": "Przywróć tę treść",
    "Deleted the card “{TITLE}”.": "Usunięto kartę „{TITLE}”.",
    "Card history: {TITLE}": "Historia karty: {TITLE}",
    "Pick any two revs to compare them in the Archive's table.":
      "Do porównania można wybrać dowolne dwie wersje; tabela jest taka sama jak w Archiwum.",
    "Restore the text of rev {N}": "Przywróć treść z wersji {N}",
    "It comes back as a new change in the draft. Nothing in the archive changes.":
      "Wraca jako nowa zmiana w szkicu. Nic w archiwum się nie zmienia.",
    /* A whole edition back into the draft, from the Archive (the outside review of 2026-10-21, item 1): the lead
       engineer's draft words, plain, for the copywriter to refine. */
    "Restore to the draft…": "Przywróć do szkicu…",
    "Restore rev {R} ({EDITION}) to the draft?": "Przywrócić do szkicu wersję {R} ({EDITION})?",
    "Restore edition {EDITION} to the draft?": "Przywrócić do szkicu wydanie {EDITION}?",
    "The draft's cards, languages and other content become this edition's. The catalog's id, rev, date and the lead's note stay as they are, and so does a category rename not yet published.":
      "Karty, języki i pozostała treść szkicu przyjmą postać z tego wydania. Identyfikator katalogu, numer wersji, data i notatka lidera zostają bez zmian, podobnie jak nieopublikowana zmiana nazwy kategorii.",
    "The next Publish sends it out as a new edition, rev {N}.":
      "Następna publikacja wyśle go jako nowe wydanie, wersję {N}.",
    "Nothing in the archive changes, and every edition already published stays as it is.":
      "Nic w archiwum się nie zmienia, a każde opublikowane już wydanie zostaje takie, jakie było.",
    "The restore can be undone from Changes, even after a later edit: the draft comes back as it was just before the restore, its unpublished changes included.":
      "Przywrócenie można cofnąć na liście Zmiany, także po późniejszej edycji: szkic wróci do stanu sprzed przywrócenia, razem z nieopublikowanymi zmianami.",
    "Undoing this restore also drops the changes made after it: {N}.":
      "Cofnięcie tego przywrócenia usuwa też zmiany wprowadzone po nim: {N}.",
    "Undo and drop the later changes": "Cofnij i usuń późniejsze zmiany",
    "Keep the later changes": "Zostaw późniejsze zmiany",
    "Restore to the draft": "Przywróć do szkicu",
    "Restored rev {R} ({EDITION}) to the draft.": "Przywrócono do szkicu wersję {R} ({EDITION}).",
    "Restored edition {EDITION} to the draft.": "Przywrócono do szkicu wydanie {EDITION}.",
    "The draft already holds this edition's content.": "Szkic zawiera już treść tego wydania.",
    /* The three refusals src/studio.mjs raises for Undo and Restore this text. */
    "Studio no longer remembers the deleted card, so the deletion cannot be undone":
      "Studio nie pamięta już usuniętej karty, więc usunięcia nie da się cofnąć",
    "the catalog has changed since the card was deleted, so the deletion can no longer be undone":
      "katalog zmienił się od usunięcia karty, więc tego usunięcia nie da się już cofnąć",
    "rev {R} holds no card {ID}, so there is no text in it to restore":
      "wersja {R} nie zawiera karty {ID}, więc nie ma z niej treści do przywrócenia",
    "edition {E} holds no card {ID}, so there is no text in it to restore":
      "wydanie {E} nie zawiera karty {ID}, więc nie ma z niego treści do przywrócenia",
    /* Bulk upkeep and the spreadsheet round trip (board 834, step 10, C09): Claudia's sheet words where it has them (the
       strip, the bar, the Import page, the table's three words); where it has none the value is [PL pending] and the English,
       and the counted nouns and the short labels are written here for the copywriter to check. */
    "Find and replace":
      "Znajdź i zamień",
    "Replace with":
      "Zamień na",
    "Whole words":
      "Całe słowa",
    "Match case":
      "Wielkość liter",
    "Replace the ticked ({N})":
      "Zamień zaznaczone ({N})",
    "Preview":
      "Podgląd",
    "{PLACES}: {WHERE}":
      "{PLACES}: {WHERE}",
    "{N} place":
      "{N} miejsce",
    "{N} places":
      "{N} miejsc",
    "{N} card ticked":
      "{N} zaznaczona karta",
    "{N} cards ticked":
      "{N} zaznaczonych kart",
    "Move to a category":
      "Przenieś do kategorii",
    "Export to a spreadsheet":
      "Eksportuj do arkusza",
    "Shift+click ticks a range":
      "Shift+klik zaznacza zakres",
    "To a spreadsheet":
      "Do arkusza",
    "Export the cards to CSV":
      "Eksportuj karty do CSV",
    "The sheet carries an id column; while it stays, the same cards come back, even retitled.":
      "Arkusz ma kolumnę id; dopóki w nim zostaje, wracają te same karty, nawet z nowym tytułem.",
    "From a spreadsheet":
      "Z arkusza",
    "Choose a spreadsheet":
      "Wybierz arkusz",
    "{FILE} · {ROWS} · matched by the id column":
      "{FILE} · {ROWS} · dopasowanie po kolumnie id",
    "Changed {N}":
      "Zmienione: {N}",
    "New {N}":
      "Nowe: {N}",
    "Unchanged {N}":
      "Bez zmian: {N}",
    "Not in the sheet {N}":
      "Brak w arkuszu: {N}",
    "A card missing from the sheet is left alone: the sheet is a patch, not the whole catalog.":
      "Karty, której nie ma w arkuszu, import nie rusza: arkusz to poprawka, nie cały katalog.",
    "new card, row {ROW}":
      "nowa karta, wiersz {ROW}",
    "{ID} · not in the sheet":
      "{ID} · nie ma w arkuszu",
    "stays as it is":
      "zostaje bez zmian",
    "Put into the draft ({CARDS})":
      "Wprowadź do szkicu ({CARDS})",
    "Replaced: {PLACES} ({WHERE}).":
      "Zamieniono: {PLACES} ({WHERE}).",
    "Retired: {CARDS}.":
      "Wycofano: {CARDS}.",
    "Deleted: {CARDS}.":
      "Usunięto: {CARDS}.",
    "Moved to “{CATEGORY}”: {CARDS}.":
      "Przeniesiono do kategorii „{CATEGORY}”: {CARDS}.",
    "Taken from the sheet: {CARDS}.":
      "Wprowadzono z arkusza: {CARDS}.",
    "Row {ROW} waits for a title in the primary language, so it stays out of the draft.":
      "Wiersz {ROW} czeka na tytuł w języku głównym, więc nie wejdzie do szkicu.",
    "Row {ROW} waits for a category, so it stays out of the draft.":
      "Wiersz {ROW} czeka na kategorię, więc nie wejdzie do szkicu.",
    "Row {ROW} stays out of the draft: its id {ID} already belongs to an earlier row.":
      "Wiersz {ROW} nie wejdzie do szkicu: identyfikator {ID} ma już wcześniejszy wiersz.",
    "Text in languages outside this catalog is passed over: {LANGS}. Languages are added in Catalog details.":
      "Pominięto tekst w językach spoza katalogu: {LANGS}. Języki dodaje się w Szczegółach katalogu.",
    /* The three refusals src/studio.mjs raises for the sheet and the undo. */
    "Rows are matched to cards by an id column, and this sheet has none; every sheet exported from Studio has one, headed id":
      "Wiersze arkusza dopasowuje się do kart po kolumnie id, a ten arkusz jej nie ma; ma ją każdy arkusz wyeksportowany ze Studia, pod nagłówkiem id",
    "Intents and roles are edited in Studio itself, so the sheet's columns for them are passed over.":
      "Intencje i role zmienia się w samym Studiu, więc ich kolumny w arkuszu są pomijane.",
    "the sheet has changed since it was shown, so nothing from it has gone into the draft; chosen again, it shows what it holds now":
      "arkusz zmienił się od czasu podglądu, więc nic z niego nie trafiło do szkicu; wybrany jeszcze raz pokaże, co zawiera teraz",
    "the file has changed since it was shown, so nothing from it has gone in; chosen again, it shows what it holds now":
      "plik zmienił się od czasu podglądu, więc nic z niego nie trafiło; wybrany jeszcze raz pokaże, co zawiera teraz",
    "the catalog has changed since the sheet was shown, so nothing from the sheet has gone into the draft; chosen again, the sheet is compared with the catalog as it is now":
      "katalog zmienił się od czasu podglądu arkusza, więc nic z arkusza nie trafiło do szkicu; arkusz wybrany jeszcze raz zostanie porównany z katalogiem w obecnej postaci",
    "Studio no longer remembers this change, so it cannot be undone":
      "Studio nie pamięta już tej zmiany, więc nie da się jej cofnąć",
    "the catalog has changed since, so this change can no longer be undone":
      "katalog zmienił się od tamtej pory, więc tej zmiany nie da się już cofnąć",
    /* Since the last edition's own undo refusals (board 862), written by the copywriter on 2026-10-07 after the window
       leg polish 7a found the first three without Polish. */
    "Studio no longer holds this change, so it cannot be undone":
      "Studio nie pamięta już tej zmiany, więc nie da się jej cofnąć",
    "this place is no longer in the change, so it cannot be undone":
      "tego miejsca nie ma już w tej zmianie, więc zamiany nie da się tu cofnąć",
    "this place has changed since, so it can no longer be undone on its own":
      "tekst w tym miejscu zmienił się od tamtej pory, więc tej zamiany nie da się już cofnąć osobno",
    "the card has changed since, so this change can no longer be undone on its own":
      "karta zmieniła się od tamtej pory, więc tej zmiany nie da się już cofnąć osobno",
    "the quick facts have changed since, so this change can no longer be undone on its own":
      "szybkie fakty zmieniły się od tamtej pory, więc tej zmiany nie da się już cofnąć osobno",
    "the catalog has changed there since, so this change can no longer be undone on its own":
      "katalog zmienił się w tym miejscu od tamtej pory, więc tej zmiany nie da się już cofnąć osobno",
    "a card is in a category this change made, so the change can no longer be undone on its own":
      "w kategorii utworzonej tą zmianą jest już karta, więc tej zmiany nie da się już cofnąć osobno",

    /* The Desks screen and its passphrase cover (board 834, the sealed team), with the refusals behind them: the
       engineer seat's Polish, written with the screen, for the copywriter to replace. */
    "Key": "Klucz",
    "Status": "Stan",
    "its own name: {NAME}": "własna nazwa: {NAME}",
    "admitted": "przyjęte",
    "named": "nazwane",
    "No teammate is on the roster yet.": "Na liście nie ma jeszcze żadnego członka zespołu.",
    "Sealing signs the team file with this Studio's signing key, and there is none yet.": "Pieczętowanie wymaga podpisania pliku zespołu kluczem podpisu tego Studia, a tego klucza jeszcze nie ma.",
    "The team file in this folder is not this Studio's own, so it is left as it is.": "Plik zespołu w tym folderze nie pochodzi z tego Studia, więc zostaje bez zmian.",
    "The team file in this folder does not read whole, so it is left as it is.": "Pliku zespołu w tym folderze nie da się odczytać w całości, więc zostaje bez zmian.",
    "The team file in this folder is older than one this Studio has already seen, so it is left as it is.": "Plik zespołu w tym folderze jest starszy od tego, który to Studio już widziało, więc zostaje bez zmian.",
    "This computer cannot keep a team key for this Windows account.": "Na tym komputerze nie da się przechować klucza zespołu dla tego konta Windows.",
    "This computer cannot keep a team key for this account: no keyring is open to seal it. To have one, install GNOME Keyring (the gnome-keyring package) or KDE Wallet, sign in again and reopen Studio.": "Na tym komputerze nie da się przechować klucza zespołu dla tego konta: żaden magazyn kluczy nie jest otwarty, by go zapieczętować. Aby go mieć, zainstaluj GNOME Keyring (pakiet gnome-keyring) albo Portfel KDE, zaloguj się ponownie i otwórz Studio jeszcze raz.",
    /* Letting go of a team this Studio holds no keys for: the copywriter's words of 2026-11-19, section 8 of words-studio-door-and-neighbours, in
       the form with no team's name, which this Studio does not have for a team it holds no file or row for (the refusal included). */
    "This project belongs to a team whose keys are not in this Studio, so nothing can be published to it from here. Letting go of the team leaves the draft as it is and lets the project make or choose a team again.": "Ten projekt należy do zespołu, którego kluczy nie ma w tym Studiu, więc nic nie da się stąd dla niego opublikować. Odłączenie zespołu zostawia wersję roboczą bez zmian i pozwala projektowi znów utworzyć albo wybrać zespół.",
    "Let go of the team…": "Odłącz zespół…",
    "Let go of the team for this project?": "Odłączyć ten zespół od projektu?",
    "The team's members keep what they already have. This Studio can no longer publish to that team. The catalog's draft stays as it is.": "Osoby z zespołu zachowują to, co już mają. To Studio nie będzie już mogło publikować dla tego zespołu. Wersja robocza katalogu zostaje bez zmian.",
    "Let go": "Odłącz",
    "This Studio now holds that team's keys, or the project names no team any more, so nothing was let go.": "To Studio ma już klucze tego zespołu albo projekt nie wskazuje już żadnego zespołu, więc niczego nie odłączono.",
    "This Studio does not hold the team's current key, so a sealed publish waits for it.": "To Studio nie ma bieżącego klucza zespołu, więc zapieczętowana publikacja na niego czeka.",
    /* Board 949 W5 and W6, the copywriter's words of 2026-10-30 04:05. */
    "To open {NAME}, Studio needs its folder, which is no longer at {FOLDER} or is on a drive not connected now. Once the drive is connected, the catalog opens here again; a folder moved elsewhere opens with Open a folder as a catalog of its own, and this one can then be closed with Close catalog.": "Aby otworzyć katalog {NAME}, Studio potrzebuje jego folderu, a nie ma go już w miejscu {FOLDER} albo leży on na dysku, który nie jest teraz podłączony. Gdy dysk zostanie podłączony, katalog znów się tu otworzy; folder przeniesiony gdzie indziej otworzy się przez Otwórz folder jako osobny katalog, a ten można wtedy zamknąć przyciskiem Zamknij katalog.",
    "No teammate can open what is published here until one is admitted.": "Nikt z zespołu nie otworzy tego, co tu trafia, dopóki ktoś nie zostanie przyjęty.",
    "Publishing": "Publikowanie",
    "Sealed": "Zapieczętowane",
    "Plain": "Jawne",
    "A desk's export": "Eksport ze stanowiska",
    "Plain, an exported file opens anywhere. Sealed, it opens only inside the team.": "Jawny eksport otworzy się wszędzie, zapieczętowany tylko w zespole.",
    "Seal what a desk exports": "Pieczętowanie eksportu ze stanowisk",
    "Sharing cards between teammates": "Udostępnianie kart w zespole",
    "Members can share single cards of their own with named teammates, who keep or decline them. Turned off, no desk can share a new card; cards already kept, or already waiting, stay.": "Osoby z zespołu mogą udostępniać pojedyncze własne karty wybranym osobom z zespołu, które je zachowują albo odrzucają. Po wyłączeniu żadne stanowisko nie może udostępnić nowej karty; karty już zachowane albo oczekujące zostają.",
    "Off here; the desks stop offering it once the next publish reaches them.": "Wyłączone tutaj; stanowiska przestaną to oferować, gdy dotrze do nich następna publikacja.",
    "On here; the desks offer it once the next publish reaches them.": "Włączone tutaj; stanowiska zaczną to oferować, gdy dotrze do nich następna publikacja.",
    "Let a desk export in the clear": "Jawny eksport ze stanowisk",
    "Who can read what you publish": "Kto odczyta publikowane pliki",
    "A plain copy": "Jawna kopia",
    "Export a plain copy…": "Eksportuj jawną kopię…",
    "Team key": "Klucz zespołu",
    /* What the team key means for the lead, in place of its generation number (rev words, 2026-10-15). A draft, the copywriter's to replace. */
    "held by this Studio": "jest w tym Studiu",
    "held by this Studio; made new when a member was removed": "jest w tym Studiu; wymieniony po usunięciu członka zespołu", /* plant:txrw-rw3 */
    "not held by this Studio": "tego klucza nie ma w tym Studiu",
    "none yet": "jeszcze brak",
    "Roster": "Lista członków zespołu",
    "Seal": "Zapieczętuj",
    "Unseal": "Odpieczętuj",
    "A team file is signed with this Studio's signing key, and Settings shows there is none yet.": "Plik zespołu podpisuje się kluczem podpisu tego Studia, a Ustawienia pokazują, że jeszcze go nie ma.",
    "This catalog is kept inside {FOLDER}, so a sealed copy there would sit beside the catalog in the clear; nothing was changed.": "Ten katalog leży w folderze {FOLDER}, więc zapieczętowana kopia leżałaby tam obok jawnego katalogu; nic nie zmieniono.",
    "This catalog has a team already, so it did not join another.": "Ten katalog ma już zespół, więc nie dołączono go do innego.",
    "The team file in {FOLDER} is not the team this Studio leads, so this catalog did not join it.": "Plik zespołu w folderze {FOLDER} nie należy do zespołu, który prowadzi to Studio, więc nie dołączono do niego tego katalogu.",
    "This team's catalogs go out in the clear, so another catalog cannot join it.": "Katalogi tego zespołu są publikowane jawnie, więc nie może do niego dołączyć inny katalog.",
    "{FOLDER} already holds {FILE}, which is another catalog, so this catalog did not join the team. Under another file name it can.": "W folderze {FOLDER} jest już plik {FILE}, a to inny katalog, więc nie dołączono tego katalogu do zespołu. Pod inną nazwą pliku będzie to możliwe.",
    "This catalog is on another team this Studio leads, so it did not join this one.": "Ten katalog należy do innego zespołu, który prowadzi to Studio, więc nie dołączono go do tego zespołu.",
    "A move or a handover of this team is under way, so no catalog can join it until that ends. Nothing was changed.": "Trwa przeniesienie lub przekazanie tego zespołu, więc dopóki się nie zakończy, żaden katalog nie może do niego dołączyć. Nic nie zmieniono.",
    "The relay licence for this team has ended, so no catalog can join it until the licence is renewed. Nothing was changed.": "Licencja na przekaźnik dla tego zespołu wygasła, więc dopóki nie zostanie odnowiona, żaden katalog nie może do niego dołączyć. Nic nie zmieniono.",
    "The relay no longer accepts this team's relay licence, so no catalog can join it until Studio has a new one. Studio is fetching it, and nothing needs doing. Nothing was changed.": "Przekaźnik nie przyjmuje już licencji na przekaźnik dla tego zespołu, więc dopóki Studio nie otrzyma nowej, żaden katalog nie może do niego dołączyć. Studio już ją pobiera i nic nie trzeba robić. Nic nie zmieniono.",
    "The relay no longer accepts this team's relay licence, so no catalog can join it until Studio has a new one. Nothing was changed.": "Przekaźnik nie przyjmuje już licencji na przekaźnik dla tego zespołu, więc dopóki Studio nie otrzyma nowej, żaden katalog nie może do niego dołączyć. Nic nie zmieniono.",
    "This Studio does not lead that team as a sealed one, so the catalog did not join it. Nothing was changed.": "To Studio nie prowadzi tego zespołu jako zapieczętowanego, więc nie dołączono do niego katalogu. Nic nie zmieniono.",
    /* A catalog chooses its team, on the page (board 962 stage 5, T5): the cover's third choice, the Teams screen's Add a catalog to
       this team, the Writes to row of a team of several catalogs and the Desks screen's team catalog. */
    "The team": "Zespół",
    "These teammates run an Etiuda older than {VERSION}, which may mix up this team's catalogs until it is updated: {NAMES}.": "Ci członkowie zespołu mają Etiudę starszą niż {VERSION}, która do czasu aktualizacji może mylić katalogi tego zespołu: {NAMES}.",
    "1 teammate has not reported its version yet, so it may run an older Etiuda too.": "Od jednego członka zespołu nie ma jeszcze wersji, więc także tam może działać starsza Etiuda.",
    "Teammates that have not reported their version yet: {N}. Some of them may run an older Etiuda too.": "Członkowie zespołu bez podanej jeszcze wersji: {N}. Także u części z nich może działać starsza Etiuda.",
    "Add it all the same": "Dodaj mimo to",
    "Add to this team": "Dodaj do tego zespołu",
    "The catalog is in the team now, and every teammate receives it.": "Katalog jest już w zespole i trafia do wszystkich jego członków.",
    "The catalog is in the team now, and every teammate receives it with its next published edition.": "Katalog jest już w zespole, a jego członkowie otrzymają go z następnym opublikowanym wydaniem.",
    "Add a catalog to this team": "Dodaj katalog do tego zespołu",
    "Invite a teammate is offered here once the team holds a catalog, so an empty team starts with Add a catalog to this team.": "Przycisk Zaproś członka zespołu pojawia się tutaj, gdy zespół ma katalog, więc pusty zespół zaczyna od przycisku Dodaj katalog do tego zespołu.",
    "End this team": "Zakończ ten zespół",
    "This Studio does not lead that team, so the team was not ended.": "To Studio nie prowadzi tego zespołu, więc zespół nie został zakończony.",
    "This team still has an invitation that can let a teammate in, so it was not ended. Once the invitation is withdrawn, the team can be ended. Nothing was changed.": "Ten zespół ma wciąż zaproszenie, dzięki któremu może dołączyć nowy członek, więc nie został zakończony. Po wycofaniu zaproszenia zespół można zakończyć. Nic nie zmieniono.",
    "A shortcut can be changed to an F key or a combination with Ctrl or Alt, since keys needed for typing stay with typing.": "Skrót można zmienić na klawisz F albo połączenie z Ctrl lub Alt, bo klawisze potrzebne do pisania zostają do pisania.",
    "There is no catalog in the Library yet.": "W Bibliotece nie ma jeszcze żadnego katalogu.",
    "Back to the default": "Przywrócono domyślny skrót",
    "Alternative cleared": "Usunięto skrót alternatywny",
    "none": "brak",
    "Every catalog in the Library has a team already.": "Każdy katalog w Bibliotece ma już zespół.",
    "another catalog of this team: {TITLE}, rev {R}": "inny katalog tego zespołu: {TITLE}, wer. {R}",
    "another catalog of this team: {TITLE}": "inny katalog tego zespołu: {TITLE}",
    /* A catalog taken off its team, or moved to another (board 962 stage 6, U1 and U3). */
    "Take {TITLE} off {TEAM}?": "Odłączyć katalog {TITLE} od zespołu {TEAM}?",
    "Its editions leave the team's place, so the catalog leaves the Library on every teammate's desk and no new edition of it reaches them.": "Jego wydania znikną z miejsca zespołu, więc katalog zniknie z Biblioteki na stanowiskach wszystkich członków zespołu i nie dotrze do nich żadne nowe wydanie.",
    "Adding it to {TEAM} again and publishing brings it back.": "Ponowne dodanie go do zespołu {TEAM} i opublikowanie przywraca go.",
    "Take off this team": "Odłącz od tego zespołu",
    "Move to another team…": "Przenieś do innego zespołu…",
    "{TITLE}, not among this Studio's catalogs": "{TITLE}, poza katalogami tego Studia",
    "catalog {ID}, not among this Studio's catalogs": "katalog {ID}, poza katalogami tego Studia",
    "This team holds no catalog.": "Ten zespół nie ma żadnego katalogu.",
    "The catalog is off the team, and it publishes nowhere until it is given a team.": "Katalog jest już odłączony od zespołu i nie będzie nigdzie publikowany, dopóki nie otrzyma zespołu.",
    "This catalog is on no team, so it publishes nowhere yet. Put it on a team, or make one first.": "Ten katalog nie należy do żadnego zespołu, więc nigdzie jeszcze nie jest publikowany. Dodaj go do zespołu albo najpierw utwórz zespół.",
    "Move {CATALOG} to another team": "Przeniesienie katalogu {CATALOG} do innego zespołu",
    "Teammates on {FROM} working in this catalog now, each keeping the edition it has: {N}.": "Członkowie zespołu {FROM}, którzy teraz pracują w tym katalogu i zachowają swoje wydanie: {N}.",
    "Teammates on {FROM} with changes to it waiting in review, which are withdrawn once it leaves: {N}.": "Członkowie zespołu {FROM} ze zmianami czekającymi na przegląd, które zostaną wycofane, gdy katalog odejdzie: {N}.",
    "Review first": "Najpierw przegląd",
    "Teammates on {TO} who will receive it: {N}.": "Członkowie zespołu {TO}, do których trafi: {N}.",
    "Move to this team": "Przenieś do tego zespołu",
    "The catalog is on {TEAM} now.": "Katalog jest teraz w zespole {TEAM}.",
    "Moving to {TEAM}": "W trakcie przenoszenia do zespołu {TEAM}",
    "Finish the move": "Dokończ przenoszenie",
    "Put it back on {TEAM}": "Przywróć do zespołu {TEAM}",
    "Part way off {TEAM}": "W trakcie odłączania od zespołu {TEAM}",
    "Teammates receive this catalog once it is first published.": "Członkowie zespołu otrzymają ten katalog po jego pierwszej publikacji.",
    "This Studio waits for the team's lead to publish a first edition.": "To Studio czeka na pierwsze wydanie od lidera zespołu.",
    "Finish taking off": "Dokończ odłączanie",
    "{CATALOG}, on {TEAM}": "{CATALOG}, w zespole {TEAM}",
    "{CATALOG}, on no team": "{CATALOG}, poza zespołami",
    "The team file in {FOLDER} does not read whole, so it is left as it is.": "Pliku zespołu w folderze {FOLDER} nie da się odczytać w całości, więc zostaje bez zmian.",
    "The team file in {FOLDER} is not this Studio's own, so it is left as it is.": "Plik zespołu w folderze {FOLDER} nie pochodzi z tego Studia, więc zostaje bez zmian.",
    "The team file in {FOLDER} is older than one this Studio has already seen, so it is left as it is.": "Plik zespołu w folderze {FOLDER} jest starszy od tego, który to Studio już widziało, więc zostaje bez zmian.",
    "there is no team here this Studio leads, so there is nothing to open": "tu nie ma zespołu prowadzonego z tego Studia, więc nie ma czego otworzyć",
    "there is no team here this Studio leads, so there is nothing to refuse": "tu nie ma zespołu prowadzonego z tego Studia, więc nie ma czemu odmówić",
    "This Studio has no signing key.": "To Studio nie ma klucza podpisu.",
    "This Studio's signing key could not be read.": "Nie udało się odczytać klucza podpisu tego Studia.",
    "This Studio's signing key could not be opened.": "Nie udało się otworzyć klucza podpisu tego Studia.",
    "There is no team here to hand over.": "Tu nie ma zespołu do przekazania.",
    "This team is not led by another signing key.": "Tego zespołu nie prowadzi inny klucz podpisu.",
    "This Studio does not hold the old signing key for this team.": "To Studio nie ma poprzedniego klucza podpisu tego zespołu.",
    "{FOLDER} is where this catalog publishes sealed, and a plain copy there would be read by anyone; nothing was written.": "Do folderu {FOLDER} ten katalog publikuje pliki zapieczętowane, a jawną kopię mógłby tam przeczytać każdy; nic nie zapisano.",
    "The same passphrase again": "To samo hasło jeszcze raz",
    "The two passphrases differ, so nothing was kept. Both fields are ready to type it again.": "Oba hasła się różnią, więc nic nie zapisano. Można wpisać je ponownie.",
    /* The signing key kept by the operating system, its backup copy and its restore (K4 to K8, the ruling of 2026-10-07 20:42),
       the key's sign (G1) and the backup disc: the engineer seat's words, written with the screens, for the copywriter. */
    "A teammate's key": "Klucz członka zespołu",
    "Studio's signing key": "Klucz podpisu Studia",
    "Make a new key": "Utwórz nowy klucz",
    "Make a signing key": "Utwórz klucz podpisu",
    "Restore it from a backup copy…": "Przywróć go z kopii zapasowej…",
    "Restore a backup…": "Przywróć z kopii…",
    "It opens with a passphrase. Restore it once and this computer keeps it.": "Ten klucz wymaga hasła. Wystarczy przywrócić go raz, a dalej przechowa go ten komputer.",
    "Restored. This computer keeps it under your sign-in.": "Przywrócony. Przechowuje go ten komputer, pod ochroną logowania do konta.",
    /* Said once, on the restore cover, where a copy kept no statistics seal. Earlier statistics stay shut. They come back once this Studio next changes the team, at each desk's next write. For the copywriter. */
    "Statistics sealed earlier stay shut on this computer, since this copy carries no seal for them. Once this Studio next changes the team, each teammate's statistics start again from that teammate's next write.": "Statystyki zapieczętowane wcześniej pozostaną na tym komputerze zamknięte, bo ta kopia nie zawiera ich pieczęci. Gdy to Studio następnym razem zmieni zespół, statystyki każdego członka zespołu ruszą znowu od jego najbliższego zapisu.",
    "Made. This computer keeps it under your sign-in, so nothing asks for a passphrase.": "Utworzony. Przechowuje go ten komputer, pod ochroną logowania do konta, więc nic nie prosi o hasło.",
    "A backup copy is in {FOLDER}, made {DATE}.": "Kopia zapasowa leży w folderze {FOLDER}, utworzona {DATE}.",
    "Make another…": "Utwórz kolejną…",
    "A backup copy brings it to another computer.": "Kopia zapasowa przeniesie go na inny komputer.",
    "Make a backup copy…": "Utwórz kopię zapasową…",
    "The team trusts what Studio signs with it.": "Zespół ufa temu, co Studio nim podpisze.",
    "Show the file": "Pokaż plik",
    "A backup copy of the signing key": "Kopia zapasowa klucza podpisu",
    "With the copy and its passphrase, the key comes back on a new computer and every teammate carries on as before. Keep it somewhere off this computer: a USB stick, or a drive someone you trust can reach.": "Z kopią i jej hasłem klucz wróci na nowym komputerze, a cały zespół będzie pracować jak dotąd. Kopię najlepiej trzymać poza tym komputerem: na pendrivie albo na dysku, do którego dostęp ma zaufana osoba.",
    "A passphrase for the copy": "Hasło do kopii",
    "This copy holds a different signing key from the one in place. The one in place is set aside on this computer, not lost, and can be restored again.": "Ta kopia zawiera inny klucz podpisu niż obecny. Obecny zostanie odłożony na tym komputerze, a nie utracony, i można go przywrócić.",
    "The copy's key for the desks' figures would not open, so it was left out, and the one already here stays.": "Klucz do danych stanowisk z tej kopii nie dał się otworzyć, więc go pominięto, a zostaje ten, który już tu jest.",
    "Anyone who can read this copy can try passphrases against it, so a long passphrase keeps it safe.": "Każdy, kto może odczytać tę kopię, może próbować odgadnąć hasło, więc chroni ją długie hasło.",
    "This signing key is sealed without a keyring, so anyone who copies Studio's settings folder can open it. Installing GNOME Keyring or KDE Wallet, signing in again and making a new key keeps it under your sign-in.": "Ten klucz podpisu jest zapieczętowany bez magazynu kluczy, więc może go otworzyć każdy, kto skopiuje folder ustawień Studia. Po zainstalowaniu GNOME Keyring lub KDE Wallet, ponownym zalogowaniu i utworzeniu nowego klucza będzie on chroniony logowaniem do konta.",
    "The copy opens only with it. Studio keeps neither; write it down, apart from the copy.": "Bez niego kopia się nie otworzy. Studio nie przechowuje ani kopii, ani hasła, więc warto je zapisać, z dala od kopii.",
    "Strength: weak": "Hasło: słabe",
    "Strength: fair": "Hasło: średnie",
    "Strength: strong": "Hasło: silne",
    "Save the copy…": "Zapisz kopię…",
    "Restore the signing key": "Przywracanie klucza podpisu",
    "The backup copy": "Kopia zapasowa",
    "Choose…": "Wybierz…",
    "The key the team in {FOLDER} already trusts.": "Temu kluczowi ufa już zespół z folderu {FOLDER}.",
    "Its passphrase": "Hasło kopii",
    "Asked this once. Afterwards this computer keeps the key under your sign-in.": "Hasło potrzebne jest tylko ten jeden raz. Potem klucz przechowuje ten komputer, pod ochroną logowania do konta.",
    "Restore the key": "Przywróć klucz",
    "The team trusts the signing key {KEY}, and it is not on this computer.": "Zespół ufa kluczowi podpisu {KEY}, a tego klucza nie ma na tym komputerze.",
    "No backup copy? A new key works too, and every teammate is let in again.": "Brak kopii zapasowej? Nowy klucz też zadziała, a każdy członek zespołu zostanie wpuszczony na nowo.",
    "If this computer is lost": "Gdyby ten komputer przepadł",
    /* Claudette's words, 2026-10-20 (board 932: a relay team whose grant holds). */
    "The key's backup copy brings back the signing key and the team's place on the relay, but not the team's files kept there.":
      "Kopia zapasowa klucza przywraca klucz podpisu i miejsce zespołu w przekaźniku, ale nie pliki zespołu, które tam są.",
    /* Claudette's words, 2026-10-26 23:46 (hold 2, a relay team opened on a computer that holds no licence). */
    "This Studio holds no licence yet, so it cannot work with the team. Once it is signed in with an account that holds the licence, from the Menu, under Settings, then Account, this computer works with the team as the first one does.":
      "To Studio nie ma jeszcze licencji, więc nie może pracować z zespołem. Gdy zostanie tu zalogowane kontem z licencją (z menu, w Ustawieniach, w części Konto), ten komputer będzie pracować z zespołem tak samo jak pierwszy.",
    "Start the new team": "Załóż nowy zespół",
    /* Draft for the copywriter. */
    "Make a team": "Utwórz zespół",
    "Nothing was changed: Etiuda Studio makes a team on the Etiuda relay, not in a shared folder. Make a team starts one there.": "Nic nie zmieniono: Etiuda Studio tworzy zespół na przekaźniku Etiudy, a nie we wspólnym folderze. Zespół zakłada się przyciskiem Utwórz zespół.",
    /* Where a team is first made: the Etiuda relay or a shared folder (board 926). Placeholders, the lead engineer's words, for
       the copywriter to replace. The first two are the lead's two choices, as the test architect's condition names them. */
    "the Etiuda relay": "przekaźnik Etiudy",
    "a shared folder": "wspólny folder",
    "Start a team on the Etiuda relay": "Zespół na przekaźniku Etiudy",
    "Editions travel through the Etiuda relay sealed, so that only the team can read them.": "Wydania idą przez przekaźnik Etiudy zapieczętowane, więc odczyta je tylko zespół.",
    "Every teammate reads a published edition from the relay.": "Każdy członek zespołu odczytuje opublikowane wydanie z przekaźnika.",
    "One roster for every catalog that publishes through the relay.": "Jedna lista członków zespołu dla wszystkich katalogów, które publikują przez przekaźnik.",
    "This catalog has a team already, so no other was started.": "Ten katalog ma już zespół, więc nie założono innego.",
    /* Board 935: the lead chose the relay and holds no grant that covers it now. Said under the choice, which still offers a shared folder. The words are the copywriter's of 2026-10-25. */
    "A licence for the Etiuda relay names this Studio's signing key, and there is none yet: make one first from the Menu, under Settings, then Signing key, with Make a signing key.":
      "Licencja na przekaźnik Etiudy wskazuje klucz podpisu tego Studia, a takiego klucza jeszcze nie ma: najpierw trzeba go utworzyć z menu, w Ustawieniach, w części Klucz podpisu, przyciskiem Utwórz klucz podpisu.",
    "This Studio holds no licence for the Etiuda relay. Signing in, from the Menu, under Settings, then Account, brings a licence or a trial.":
      "To Studio nie ma licencji na przekaźnik Etiudy. Licencję albo okres próbny daje zalogowanie się z menu, w Ustawieniach, w części Konto.", /* plant:g3-pl */
    "The licence for the Etiuda relay ended on {DATE}.":
      "Licencja na przekaźnik Etiudy wygasła: była ważna do {DATE}.",
    "The licence for the Etiuda relay names a different signing key from this Studio's, as happens when the key is made again after the licence was issued.":
      "Licencja na przekaźnik Etiudy wskazuje inny klucz podpisu niż klucz tego Studia; tak się dzieje, gdy klucz utworzono ponownie po wystawieniu licencji.",
    "This computer's clock reads a time before the licence for the Etiuda relay begins; once the clock is right, the licence holds.":
      "Zegar tego komputera wskazuje czas sprzed początku licencji na przekaźnik Etiudy; po ustawieniu właściwego czasu licencja zadziała.",
    "The licence file for the Etiuda relay is damaged, or was not issued by Etiuda.":
      "Plik licencji na przekaźnik Etiudy jest uszkodzony albo nie został wystawiony przez Etiudę.",
    "Make a backup copy of the signing key": "Utwórz kopię zapasową klucza podpisu",
    "The signing key did not open on this computer, so nothing was written.": "Klucz podpisu nie otworzył się na tym komputerze, więc nic nie zapisano.",
    "A backup copy needs a passphrase; nothing was written.": "Kopia zapasowa wymaga hasła; nic nie zapisano.",
    /* W10, the copywriter's words (2026-11-02, 71692af3). */
    "To restore the signing key, pick the file Studio wrote with Make a backup copy…, whose name begins etiuda-studio-key- unless it was renamed; {FILE} is not such a copy.":
      "Aby przywrócić klucz podpisu, wystarczy wybrać plik zapisany przez Studio przyciskiem Utwórz kopię zapasową…; jeśli nie zmieniono mu nazwy, zaczyna się od etiuda-studio-key-. Plik {FILE} nie jest taką kopią.",
    "The passphrase does not open this copy. Nothing was changed.": "To hasło nie otwiera tej kopii. Nic nie zmieniono.",
    "This computer cannot keep a signing key for this account: no keyring is open to seal it. To have one, install GNOME Keyring (the gnome-keyring package) or KDE Wallet, sign in again and reopen Studio.": "Na tym komputerze nie da się przechować klucza podpisu dla tego konta: żaden magazyn kluczy nie jest otwarty, by go zapieczętować. Aby go mieć, zainstaluj GNOME Keyring (pakiet gnome-keyring) albo Portfel KDE, zaloguj się ponownie i otwórz Studio jeszcze raz.",
    "This computer cannot keep a signing key for this Windows account.": "Na tym komputerze nie da się przechować klucza podpisu dla tego konta Windows.",
    "This Studio has a signing key already, so no other was made.": "To Studio ma już klucz podpisu, więc nie utworzono drugiego.",
    /* A key file that does not read (board 931, condition 9, finding 8): the lead engineer's words and the draft Polish below,
       impersonal, for the copywriter to replace. */
    "{FILE} in {FOLDER} is not a signing key this Studio can read, so no new key was made over it. Once it is moved out of that folder, Studio can make a new key; catalogs signed by the old key then verify only with the old key's backup copy.":
      "{FILE} w folderze {FOLDER} nie jest kluczem podpisu, który to Studio potrafi odczytać, więc nie utworzono nowego klucza w miejsce tego pliku. Po przeniesieniu pliku poza ten folder Studio może utworzyć nowy klucz; katalogi podpisane starym kluczem zweryfikuje się wtedy tylko kopią zapasową starego klucza.",
    "This Studio keeps another signing key, so the copy was not restored.": "To Studio przechowuje inny klucz podpisu, więc kopii nie przywrócono.",
    /* The commitment mark and the cards that follow, in the card editor (board 814, step 11, S3b). The first eight are
       Claudette's (state/drafts/copy-chains-lint-2026-10-04.md, S1 to S7 and M5; the tooltip is S4b, since the detector
       counts a done act); the rest are the engineer seat's, written with the screen, for the copywriter to replace. */
    "Commitment": "Zobowiązanie",
    "This card commits the firm": "Ta karta zobowiązuje firmę",
    "Desks then show it with a stamp.": "Stanowiska pokażą ją wtedy z pieczątką.",
    "For a card that tells the customer what the firm will do, or has done: a refund, a parcel sent, a date kept.": "Gdy karta mówi klientowi, co firma zrobi albo już zrobiła: zwrot pieniędzy, wysyłka, termin.",
    "Checks: “{PHRASE}” reads like a commitment.": "Kontrola: „{PHRASE}” brzmi jak zobowiązanie.",
    "Dismiss": "Pomiń",
    "Terminus: nothing comes next on the path.": "Stacja końcowa: po tej karcie nie ma następnej.",
    "Commitment: the customer can hold the firm to this.": "Zobowiązanie: klient może trzymać firmę za słowo.",
    "Next cards": "Następne karty",
    "After this card, every desk offers these in this order. Drag to reorder.": "Po tej karcie każde stanowisko proponuje te karty w tej kolejności. Kolejność zmienia się przeciągnięciem.",
    "Show on the Paths map": "Pokaż na mapie ścieżek",
    "Take it off this list": "Usuń z tej listy",
    "Add a card": "Dodaj kartę",
    "Find a card by its title": "Wyszukiwanie karty po tytule",
    "No card's title holds that.": "Żaden tytuł karty tego nie zawiera.",
    /* Assigned intents as chips with search picker (board 960). */
    "Find an intent to add": "Szukaj intencji do dodania",
    "No intent matches this.": "Żadna intencja do tego nie pasuje.",
    "Remove {NAME} from this card": "Usuń z tej karty: {NAME}",

    /* The Paths map (board 814, S3c). The first eight are Claudia's, from the glossary of her frames C3 and C4 of
       2026-09-29; the next four are hers adapted: "(signed)" dropped, because a
       draft is not signed until it is published, and the statistics' own period in place of thirty days. The rest are
       the engineer seat's, written with the screen, for the copywriter to replace. */
    "Paths": "Ścieżki",
    "Paths from the card: {TITLE}": "Ścieżki od karty: {TITLE}",
    "the team's copies, not yet a link": "kopie zespołu, jeszcze bez połączenia",
    "terminus": "stacja końcowa",
    "Terminus: nothing comes next on the path": "Stacja końcowa: po tej karcie nie ma następnej",
    "Drag from a card's dot onto another card to link them.": "Przeciągnięcie kropki karty na inną kartę tworzy połączenie.",
    "onto a card to link": "na kartę, żeby połączyć",
    "Arrow": "Strzałka",
    "The team also copied": "Zespół kopiował też",
    "link in the catalog": "połączenie w katalogu",
    /* W14 of Claudette's vision words (state/drafts/studio-vision-words-2026-10-07.md): one verb for the act wherever
       it appears, in place of the old adopt wording, whose Polish was the one place "link" crept in. */
    "Link them": "Połącz te karty",
    "The team: {TIMES}, {P}% of the copies after this card.": "Zespół: {TIMES}, {P}% kopii po tej karcie.",
    "Thickness shows how often the team went this way.": "Grubość strzałki pokazuje, jak często zespół chodził tą drogą.",
    "Thickness shows how often the team went this way, {FROM} to {TO}.": "Grubość strzałki pokazuje, jak często zespół chodził tą drogą od {FROM} do {TO}.",
    "Click the card it should lead to. Esc cancels.": "Proszę kliknąć kartę, do której ma prowadzić. Esc przerywa łączenie.",
    "Link this card to another": "Połącz tę kartę z inną",
    "Show the paths from this card": "Pokaż ścieżki od tej karty",
    "Take the link off": "Usuń połączenie",
    "Open in the editor": "Otwórz w edytorze",
    "Starts at": "Początek ścieżki",
    "Leads to": "Prowadzi do",
    "Paths appear here once a card leads to another.": "Ścieżki pojawią się tutaj, gdy któraś karta poprowadzi do innej.",
    "New path": "Nowa ścieżka",
    "Add the next card": "Dodaj kolejną kartę",
    "Confirm these termini": "Potwierdź stacje końcowe",
    "Termini are listed but not counted: most paths are meant to reach one.": "Stacje końcowe są na liście, ale nie liczą się jako uwagi: większość ścieżek ma do którejś dojechać.",
    "Shift+Enter adds the card and carries the path on from it.": "Shift+Enter dodaje kartę i od niej prowadzi ścieżkę dalej.",
    "Bring in your replies": "Importuj odpowiedzi",
    "Spreadsheet": "Arkusz",
    "Intents, separated by ;": "Intencje, rozdzielone średnikiem",
    "This will make {CARDS}, {CATS} and {INTENTS}.": "Powstanie: {CARDS}, {CATS} i {INTENTS}.",
    "and {N} more": "i jeszcze {N}",
    "{ROWS} have commas or slashes in the intents column; each such cell stays one intent. To make separate intents, put a semicolon between them.": "Przecinki lub ukośniki w kolumnie intencji: {ROWS}. Taka komórka zostaje jedną intencją; osobne intencje rozdziela się średnikiem.",
    "Replies": "Odpowiedzi",
    "One reply": "Jedna odpowiedź",
    "Alternatives": "Warianty",
    "Steps": "Kroki",
    "The agent chooses one of these to send.": "Agent wybiera, który z nich wysłać.",
    "Sent one after another, each when the agent is ready.": "Wysyłane po kolei, każdy następny wtedy, gdy agent będzie gotowy.",
    "One reply, written above in each language's box.": "Jedna odpowiedź, wpisana powyżej, w polu każdego języka.",
    "Label, {LANG} (optional)": "Etykieta, {LANG} (opcjonalnie)",
    "Reply {N}": "Odpowiedź {N}",
    "A blank line would split this reply in two on the desks, so it is saved as a single line break.": "Pusta linijka podzieliłaby tę odpowiedź na stanowiskach na dwie, więc zostanie zapisana jako zwykłe przejście do nowej linijki.",
    "Add an alternative": "Dodaj wariant",
    "Add a step": "Dodaj krok",
    "Empty here, so the desks skip it in {LANG} and every later reply moves up a place.": "Pole „{LANG}” jest puste, więc stanowiska pominą tę odpowiedź, a każda następna przesunie się o miejsce wyżej.",
    /* The Replies block's three refusals, said after the screen's own lead-in (the copywriter's words, 2026-10-13). */
    "a card holds one reply, alternatives or steps": "karta zawiera jedną odpowiedź, warianty albo kroki",
    "a card needs at least one reply with text in it": "karta musi mieć co najmniej jedną odpowiedź z treścią",
    "the version of Etiuda this Studio is built on does not read {MARK} as a marker": "wersja Etiudy, na której zbudowano to Studio, nie odczytuje {MARK} jako znacznika",
    "reply {N} is empty in {CODE}, so the desks skip it and every later reply moves up a place": "odpowiedź {N} jest pusta w języku {CODE}, więc stanowiska ją pominą, a każda następna przesunie się o miejsce wyżej",
    "Found in its keywords": "Znaleziona w słowach kluczowych",
    "Found in its note": "Znaleziona w notatce",
    "Signed": "Podpisane",
    "Unsigned": "Bez podpisu",
    "The key's print is written beside the catalog file, so a desk can check the edition came from here.": "Odcisk klucza zostaje zapisany obok pliku katalogu, więc komputer zespołu może sprawdzić, że wydanie pochodzi stąd.",
    "This computer could not open the signing key, so the edition goes out unsigned.": "Ten komputer nie mógł otworzyć klucza podpisu, więc wydanie wyjdzie bez podpisu.",
    "The signing key's file on this computer cannot be read, so the edition goes out unsigned.": "Na tym komputerze nie da się odczytać pliku klucza podpisu, więc wydanie wyjdzie bez podpisu.",
    "There is no signing key yet: one is made from the Menu, under Settings, then Signing key.": "Nie utworzono jeszcze klucza podpisu: można go utworzyć z menu, w Ustawieniach, w części Klucz podpisu.",
    /* No unsigned edition after signed ones (Grok's review mu, 2026-11-22): the cover's line and the publisher's refusal
       (src/publish.mjs SIGNED_BEFORE). The copywriter's words, 2026-11-22 (a0cca6803). */
    "Earlier editions of this catalog were signed and the signing key cannot be opened here now, so this edition cannot be published unsigned: desks that trust the key would refuse it. Restore the key from the Menu, under Settings, then Signing key.":
      "Wcześniejsze wydania tego katalogu były podpisane, a klucza podpisu nie da się tu teraz otworzyć, więc tego wydania nie można opublikować bez podpisu: stanowiska, które ufają temu kluczowi, odrzuciłyby je. Klucz można przywrócić z menu, w Ustawieniach, w części Klucz podpisu.",
    "Nothing was published: earlier editions of this catalog were signed, the signing key cannot be opened here now, and desks that trust it would refuse an unsigned edition. Restore the key from the Menu, under Settings, then Signing key.":
      "Nic nie opublikowano: wcześniejsze wydania tego katalogu były podpisane, klucza podpisu nie da się tu teraz otworzyć, a stanowiska, które mu ufają, odrzuciłyby wydanie bez podpisu. Klucz można przywrócić z menu, w Ustawieniach, w części Klucz podpisu.",
    /* The key made at the first publish or seal, and the one nudge towards its backup copy (the sense pass of 2026-10-14,
       finding 9): the words are the copywriter's of 2026-10-25. */
    "Publishing makes this Studio's signing key and signs the edition with it, so every desk offers the later editions as newer versions.":
      "Publikacja utworzy klucz podpisu tego Studia i podpisze nim wydanie, więc każde stanowisko zaproponuje kolejne wydania jako nowsze wersje.",
    "Studio made its signing key, and signs every edition with it from now on.": "Studio utworzyło klucz podpisu i od teraz podpisuje nim każde wydanie.",
    /* The New card cover's text box once a shape is chosen (E2): it holds the card's first reply. The lead engineer's
       words, for the copywriter to confirm. */
    "First step": "Pierwszy krok",
    "First alternative": "Pierwszy wariant",
    "{DIR} is a file, not a folder.": "{DIR} to plik, a nie folder.",
    "Studio cannot write to {DIR}, so it cannot publish an edition there.": "Studio nie może zapisywać w folderze {DIR}, więc nie opublikuje tam wydania.",
    "Find the card the path starts from": "Wyszukiwanie karty, od której zacznie się ścieżka",
    "{N} more card": "{N} kolejna karta",
    "{N} more cards": "{N} kolejnych kart",
    /* Walk the map (board 862), Claudette's W2, W3, W5, W13, as written. */
    "Walked so far": "Przebyta droga",
    "Press a card, or Enter, to walk on; Backspace steps back.": "Kliknięcie karty lub Enter prowadzi dalej, Backspace cofa o krok.",
    "The first card opens its panel.": "Pierwsza karta otwiera swój panel.",
    "Linked in the draft; the desks have it from the next edition.": "Połączone w szkicu; stanowiska dostaną to z następnym wydaniem.",

    /* The lint list's fourth kind, a suggestion (board 814, S3e). The first twelve are Claudette's
       (state/drafts/copy-chains-lint-2026-10-04.md: L1, L2, L4 to L7, and the six rule names at the end of section 2.1);
       the five after them are the engineer seat's, written with the screen, for the copywriter to replace. */
    "“{PHRASE}” reads like a commitment": "„{PHRASE}” brzmi jak zobowiązanie",
    "Promise suggestions: {N}": "Podpowiedzi o obietnicach: {N}",
    "Replies that read like a promise, to look over.": "Odpowiedzi, które brzmią jak obietnica, do przejrzenia.",
    "Show them": "Pokaż je",
    "Hide them": "Ukryj je",
    "terminus: nothing comes next on the path": "stacja końcowa: po tej karcie nie ma następnej",
    "recognised by: {RULE}": "rozpoznano po: {RULE}",
    "before it on the path: {FROM}": "wcześniej na ścieżce: {FROM}",
    "Suggestion": "Podpowiedź",
    "A suggestion waits for your decision and never holds up publishing.": "Podpowiedź czeka na decyzję i nie wstrzymuje publikacji.",
    "a promise for later": "obietnica na przyszłość",
    "a thing promised by a date": "rzecz obiecana na termin",
    "a charge waived": "zwolnienie z kosztu",
    "a promise in so many words": "obietnica wprost",
    "a promise on a condition": "obietnica pod warunkiem",
    "an act reported as done": "czynność podana jako wykonana",
    "Suggestions": "Podpowiedzi",
    "Finding": "Uwagi",
    "{ERRORS}, {WARNINGS}, {SUGGESTIONS}": "{ERRORS}, {WARNINGS} i {SUGGESTIONS}",
    "{N} suggestion": "{N} podpowiedź",
    "{N} suggestions": "{N} podpowiedzi",
    /* The numbers check: Claudette's (2026-11-15, section 2). "Removed from another
       card" is a whole sentence of its own, since in Polish the fallback takes another case. */
    "Numbers differ between languages": "Liczby różnią się w zależności od języka",
    "Still uses {NUMBER}": "Nadal zawiera {NUMBER}",
    "Removed from {FROM}": "Usunięto z karty „{FROM}”",
    "Removed from another card": "Usunięto z innej karty",

    /* The Variables page, the card editor's use of variables and their lint (board 845): Claudette's, from
       state/drafts/variables-2026-10-06.md in the office, in her order. A key ending " ##" and a word is one
       English sentence with two Polish ones; the word is dropped where the English is shown. */
    "Variables": "Zmienne",
    "Words a desk writes in as a card is copied, chosen by the hour, the language, the customer's name and gender, the intent and the agent. Change Etiuda's own, or make your own.": "Słowa, które stanowisko wstawia w chwili kopiowania karty, dobrane do godziny, języka, imienia i płci klienta, intencji i agenta. Wbudowane można zmieniać, a własne tworzyć od zera.",
    "New variable": "Nowa zmienna",
    "Etiuda's own": "Wbudowane",
    "Your team's": "Własne",
    "Your team's variables gather here.": "Tu pojawią się własne zmienne zespołu.",
    "Etiuda's own ##chip": "wbudowana",
    "your team's": "własna",
    "changed": "zmieniona",
    "new": "nowa",
    "Greeting by the hour": "Powitanie dobrane do godziny",
    "The customer, addressed": "Zwrot do klienta",
    "The customer's full name, for a mention": "Imię i nazwisko klienta, do wzmianki",
    "Words by the customer's gender": "Słowa dobrane do płci klienta",
    "Words by the time of day": "Słowa dobrane do pory dnia",
    "The intent picked": "Wybrana intencja",
    "The chat's topic": "Temat rozmowy",
    "The agent's name as customers see it": "Imię agenta widoczne dla klientów",
    "The agent's initials": "Inicjały agenta",
    "Who is on the chat, for a note": "Kto jest po drugiej stronie czatu, do notatki",
    "What was done, for a note": "Co zrobiono, do notatki",
    "Back to Etiuda's own": "Przywróć ustawienia domyślne",
    "Restored Etiuda's own {VAR}.": "Przywrócono domyślne ustawienia {VAR}.",
    "Deleted the variable {VAR}.": "Usunięto zmienną {VAR}.",
    "Discard this new variable?": "Odrzucić szkic nowej zmiennej?",
    "Choosing another variable now discards what was typed for this one.": "Wybranie innej zmiennej odrzuci to, co wpisano w szkicu.",
    "Discard": "Odrzuć",
    "Name, in capitals": "Nazwa wielkimi literami",
    "What it is for": "Do czego służy",
    "Capital letters and digits, starting with a letter.": "Wielkie litery i cyfry, na początku litera.",
    "{VAR} is already a variable here.": "Zmienna {VAR} już tu jest.",
    "How the team addresses customers": "Jak zespół zwraca się do klientów",
    "Polish cards": "Karty po polsku",
    "First name ##address": "Po imieniu",
    "Pani or Pan, with the first name": "Pani lub Pan z imieniem",
    "Pani or Pan, with the surname": "Pani lub Pan z nazwiskiem",
    "No name": "Bez imienia",
    "English cards": "Karty po angielsku",
    "Title and surname": "Tytuł i nazwisko",
    "The desk reads the customer's gender from the first name, and the agent corrects it in one click.": "Płeć klienta stanowisko odczytuje z imienia, a agent poprawia ją jednym kliknięciem.",
    "{NAME}: {WORDS}": "{NAME}: {WORDS}",
    "Rules: the first that fits writes its words": "Reguły: słowa wstawia pierwsza pasująca",
    "If": "Jeśli",
    "Write": "Wstaw",
    "or": "lub",
    "and": "i",
    "Add a condition": "Dodaj warunek",
    "Otherwise": "W innym razie",
    "Add a rule": "Dodaj regułę",
    "Rule {N}": "Reguła {N}",
    "Drag to change the order": "Przeciągnij, aby zmienić kolejność",
    "Remove this rule": "Usuń tę regułę",
    "Choose a condition": "Wybierz warunek",
    "Etiuda's own: {VALUE}": "Domyślnie: {VALUE}",
    "left blank": "puste",
    "The clock": "Zegar",
    "Time": "Godzina",
    "Day of the week": "Dzień tygodnia",
    "Date": "Data",
    "Time of day": "Pora dnia",
    "The card": "Karta",
    "Language": "Język",
    "The customer": "Klient",
    "Full name": "Imię i nazwisko",
    "First name": "Imię",
    "Gender": "Płeć",
    "The chat": "Rozmowa",
    "Number of intents": "Liczba intencji",
    "Topic": "Temat",
    "The desk": "Stanowisko",
    "Agent": "Agent",
    "Role": "Rola",
    "is": "to",
    "is not": "to nie",
    "is one of": "jest wśród",
    "is before": "przed",
    "is after": "po",
    "is more than": "jest większa niż",
    "is less than": "jest mniejsza niż",
    "is set": "ma wartość",
    "is not set": "nie ma wartości",
    "male": "męska",
    "female": "żeńska",
    "nonbinary": "niebinarna",
    "morning": "ranek",
    "afternoon": "popołudnie",
    "evening": "wieczór",
    "not set ##value": "brak",
    "Morning": "Ranek",
    "Afternoon": "Popołudnie",
    "Evening": "Wieczór",
    "Male": "Męska",
    "Female": "Żeńska",
    "Nonbinary": "Niebinarna",
    /* The rows with no surname known (the engine's male-first, female-first, nonbinary-first): the copywriter's words, 2026-10-25. */
    "Male, first name only": "Męska, tylko imię",
    "Female, first name only": "Żeńska, tylko imię",
    "Nonbinary, first name only": "Niebinarna, tylko imię",
    "One picked": "Jedna wybrana",
    "Several picked": "Kilka wybranych",
    "The hours, shared with {DAYPART}": "Godziny pór dnia, wspólne z {DAYPART}",
    "Morning from": "Ranek od",
    "Afternoon from": "Popołudnie od",
    "Evening from": "Wieczór od",
    "first name, vocative": "imię w wołaczu",
    "first name": "imię",
    "surname": "nazwisko",
    "the intent's own words": "słowa intencji",
    "the intents, joined with “and”": "intencje połączone słowem „oraz”",
    "In a card": "W karcie",
    "{WORDS} ({DAY}, {TIME})": "{WORDS} ({DAY}, {TIME})",
    "This card's own words, rule by rule:": "Własne słowa karty, reguła po regule:",
    "Insert variable": "Wstaw zmienną",
    "or type { in the text": "lub wpisz { w tekście",
    "words by gender": "słowa według płci",
    "words by the hour": "słowa według pory dnia",
    "As {NAME} would read them on {DAY} at {TIME}": "Tak przeczyta je {NAME}: {DAY}, {TIME}",
    "Shown for {NAME} ({GENDER}), {DAY} {TIME}, {INTENT}": "Pokazano dla: {NAME} (płeć {GENDER}), {DAY}, {TIME}, {INTENT}",
    "Another customer": "Inny klient",
    "{TOKEN} gives this card's own words to each rule of {VAR}, in order:": "{TOKEN} daje kolejnym regułom zmiennej {VAR} własne słowa tej karty:",
    "{RULE}: {WORDS}": "{RULE}: {WORDS}",
    "{RULE}: the first words stand in": "{RULE}: wstawiane są pierwsze słowa",
    "This card gives {VAR} fewer words than it has rules; the rest write the first.": "Ta karta podaje dla {VAR} mniej słów, niż zmienna ma reguł; w pozostałych wstawiane są pierwsze.",
    "This card gives {GENDER} no words for nonbinary, so for a nonbinary customer the desk leaves that place to the agent.": "Ta karta nie podaje słów {GENDER} dla płci niebinarnej, więc przy płci niebinarnej stanowisko zostawi to miejsce agentowi.",
    "This card sets {PAX} by hand, apart from the catalog's address.": "Ta karta ustawia {PAX} ręcznie, niezależnie od zwrotu w katalogu.",
    /* ---- STUDIO'S LEFTOVERS (Maxim, 2026-10-06 22:20: T3, W3, R2). Claudette's, from
     * state/drafts/studio-leftovers-2026-10-06.md; the arrows' English is the desk's own (tabsPrev,
     * tabsNext) and their Polish names what Studio's tabs hold. */
    "Show every open catalog": "Pokaż wszystkie otwarte katalogi",
    "Open catalogs": "Otwarte katalogi",
    "Scroll tabs left": "Przewiń katalogi w lewo",
    "Scroll tabs right": "Przewiń katalogi w prawo",
    /* {FOLDER} is the bare last folder name, never declined; {DRIVE} is the letter with its colon. */
    "Cards shown": "Pokazywane karty",
    /* ---- PROJECTS AS PLACES (board 862). Claudette's, from state/drafts/studio-vision-words-2026-10-07.md,
     * rows P1 to P14; the rows it marks reused are the keys already above. */
    "See the open catalogs side by side ({KEY})": "Pokaż otwarte katalogi obok siebie ({KEY})",
    "Ctrl+Up": "Ctrl+strzałka w górę",
    "{CARDS}, published {WHEN}": "{CARDS}, opublikowano {WHEN}",
    "{CARDS}, never published": "{CARDS}, jeszcze nie opublikowano",
    "Current": "Bieżący",
    "Open catalogs side by side: {N}. Arrow keys move, Enter goes in, Esc goes back.":
      "Otwarte katalogi obok siebie: {N}. Strzałki wybierają, Enter otwiera, Esc wraca.",
    "{PROJECT} is open.": "Otwarty katalog: {PROJECT}.",
    /* ---- DROP, THEN TRIAGE (board 862), rows T1, T2 and T34 of the same draft. */
    "Import into {PROJECT}": "Import do katalogu {PROJECT}",
    "Read first. Nothing is written until you land it.": "Najpierw tylko odczyt. Nic nie trafia do katalogu przed zapisaniem.",
    "Read {FILE}: {ROWS}.": "Odczytano plik {FILE}: {ROWS}.",
    "Review": "Przegląd",
    /* board 1016 item 7: the proposal's table is a view, and this line opens the stack. The copywriter's words, 2026-11-22. */
    "Decide the waiting rows in Review": "Rozstrzygnij oczekujące wiersze w Przeglądzie",
    /* The stack, board 1016 item 7 (the test architect's F6 and Claude alpha's F7). The copywriter's words, 2026-11-22. */
    "You changed this row after answering it, so the earlier answer was dropped.": "Ten wiersz zmieniono po udzieleniu odpowiedzi, więc wcześniejsza decyzja przestała obowiązywać.",
    "Accept clear rows: {N}; to check: {M}": "Przyjmij wiersze bez uwag: {N}; do sprawdzenia: {M}",
    /* Apply's refusal of an accept given before the row was held (the test architect's P5). Words: placeholder. */
    "it now needs checking first": "wiersz trzeba teraz najpierw sprawdzić",
    /* A file in the inbox too large to read (Grok review kappa). Words: placeholder. */
    "{FILE} is larger than {N} MB, so Etiuda does not read it": "Plik {FILE} ma ponad {N} MB, więc Etiuda go nie odczytuje",
    /* The window's close past its 10 s wait for the presses (the test architect's read). The copywriter's words, 2026-11-22. */
    "The passages you put back are still being saved. Close the window again to close it anyway.":
      "Przywrócone fragmenty wciąż się zapisują. Ponowne zamknięcie okna zamknie je mimo to.",
    /* A press in a view the file has moved on from, refused (the test architect's R2). The copywriter's words. */
    "Nothing was put back: this passage changed in another window after it was shown here. It now shows as it stands, and pressing it again puts that back.":
      "Niczego nie przywrócono: ten fragment zmienił się w innym oknie po tym, jak go tu pokazano. Teraz widać go takim, jaki jest, a ponowne naciśnięcie przywróci go w tej postaci.",
    "Landed in the draft from {FILE}: {WHAT}.": "Zapisano w szkicu z pliku {FILE}: {WHAT}.",
    /* Claudette's words, ea86b9ee (2026-11-02). A paste named in words; since board 1016 item 7, the stack's card for its rows. */
    "Imported from pasted text": "Import z wklejonego tekstu",
    /* The copywriter's words (Claudette, 2026-11-03 11:32), follows 5 and 7 of the paste triage: what a Land says it
       landed when the file was a paste, in words and not a file name; the triage's line under its heading for a paste;
       and what Cancel drops on a paste. */
    "Landed in the draft from pasted text: {WHAT}.": "Zapisano w szkicu z wklejonego tekstu: {WHAT}.",
    "Pasted text. Nothing is written until you land them.": "Wklejony tekst. Nic nie trafia do katalogu przed zapisaniem.",
    "Closes the import and drops the pasted text. Nothing is written.": "Zamyka import bez zachowania wklejonego tekstu. Nic nie trafia do katalogu.",
    /* ---- REVIEW IN PLACE (board 862), rows R1 to R17 of the same draft. "Review" is the heading above and
     * this the button's verb, told apart by the suffix the table never shows. */
    "A file from a teammate": "Nowy plik od członka zespołu",
    "{DESK} proposes changes to {PROJECT}: {CHANGES}.": "{DESK} proponuje zmiany w katalogu {PROJECT}: {CHANGES}.",
    "Nothing is written until you land them.": "Nic nie trafia do katalogu przed zapisaniem.",
    "Later": "Później",
    "Review ##verb": "Przejrzyj",
    "Proposals: {FILES}": "Propozycje: {FILES}",
    "Decided": "Rozstrzygnięte",
    /* ---- THE STACK, the Review door's screen: the copywriter's, words-studio-review-door-2026-11-15 in the office, as
     * written. A key ending " ##door", " ##card" or " ##tag" is her word where the same English already says another
     * Polish elsewhere. */
    "Waiting on you: {N}. Nothing is written until you apply it.": "Czeka na decyzję: {N}. Nic nie zostanie zapisane przed zastosowaniem.",
    "From teammates": "Od zespołu",
    "Imported": "Zaimportowane",
    "Checks ##door": "Kontrole",
    "Flagged by desks": "Zgłoszenia ze stanowisk",
    "Changed ##card": "Zmieniona",
    "Removed ##card": "Usunięta",
    "Finding ##card": "Uwaga",
    "Looks wrong to a desk": "Zgłoszone ze stanowiska",
    "Check first ##card": "Najpierw sprawdzić",
    "Later ##tag": "Na później",
    "from {DESK}": "od stanowiska {DESK}",
    "from a desk": "od jednego ze stanowisk",
    "Other desks that flagged it too: {N}.": "Inne stanowiska, które też to zgłosiły: {N}.",
    "Accept ##door": "Akceptuj",
    "Accepted": "Zaakceptowano",
    "Rejected": "Odrzucono",
    "Mend the card": "Popraw kartę",
    "To mend": "Do poprawy",
    "Leave as it is": "Zostaw bez zmian",
    "Left as it is": "Bez zmian",
    "Accept the rest from {DESK}: {N}": "Akceptuj pozostałe od stanowiska {DESK}: {N}",
    "Decided: {N}": "Zdecydowano: {N}",
    "Not written yet. Any of them can be taken back.": "Jeszcze niezapisane. Każdą decyzję można cofnąć.",
    "Take back": "Cofnij",
    "Apply decided: {N}": "Zastosuj decyzje: {N}",
    "Applying: {N}…": "Zastosowywanie: {N}…",
    "Take everything back": "Cofnij wszystko",
    "{FILE}: applied in full and removed from the inbox.": "{FILE}: zastosowano w całości i usunięto ze skrzynki.",
    "Up, Down or the wheel to move · A yes · R no · S later · Ctrl+Z takes the last one back":
      "Góra, Dół lub kółko: przejście · A tak · R nie · S później · Ctrl+Z cofa ostatnią decyzję",
    "More below: {N}": "Niżej jeszcze: {N}",
    "Nothing left to decide.": "Nie ma już nic do decyzji.",
    "Decided and not written yet: {N}. Apply them, or take any back.":
      "Zdecydowano, ale jeszcze nie zapisano: {N}. Można je zastosować albo cofnąć dowolną decyzję.",
    "Nothing waits on you.": "Nic nie czeka na decyzję.",
    "AI drafts": "Szkice AI",
    "AI draft: new card": "Szkic AI: nowa karta",
    "AI draft: {LANG} text": "Szkic AI: tekst w języku {LANG}",
    "from the checks": "z kontroli",
    "New changes, drafts, findings and requests will show here.": "Tu pojawią się nowe zmiany, szkice, uwagi i prośby.",
    "Applied: {N}. New changes, drafts, findings and requests will show here.": "Zastosowano: {N}. Tu pojawią się nowe zmiany, szkice, uwagi i prośby.",
    "Nothing waits under {KIND}.": "Nic nie czeka w kategorii {KIND}.",
    "Waiting elsewhere: {N}.": "Czeka gdzie indziej: {N}.",
    "Show everything": "Pokaż wszystko",
    "Changed since you saw it": "Zmienione od ostatniego wyświetlenia",
    "{DESK} sent this again at {TIME}.": "Stanowisko {DESK} przesłało to ponownie o {TIME}.",
    "{DESK} sent this again at {TIME}, so the earlier answer was dropped.":
      "Stanowisko {DESK} przesłało to ponownie o {TIME}, więc wcześniejsza decyzja przestała obowiązywać.",
    "Write the first card with +, or drop a file anywhere on the window to bring its rows in for review.":
      "Pierwszą kartę dodaje się przyciskiem +, a plik upuszczony w dowolnym miejscu okna trafia do przeglądu.",
    "Not applied: {REASON}.": "Nie zastosowano: {REASON}.",
    "the licence is paused": "licencja jest wstrzymana",
    "the team already has as many members as the licence allows": "zespół ma już tylu członków, ilu pozwala licencja",
    "the team's key comes back only with the signing key's backup copy": "klucz zespołu wróci dopiero z kopią zapasową klucza podpisu",
    "it changed after it was opened": "wiersz zmienił się po otwarciu",
    "{ANSWER}: {TITLE}. Waiting: {N}.": "{ANSWER}: {TITLE}. Czeka: {N}.",
    "{ANSWER}: {TITLE}. Nothing left to decide.": "{ANSWER}: {TITLE}. Nie ma już nic do decyzji.",
    "Moved to the end": "Przeniesiono na koniec",
    "Taken back": "Cofnięto",
    /* ---- THE VISION IDEAS OF CLAUDIA γ (board 862): Claudette's, state/drafts/studio-vision-words-2026-10-07.md,
     * landed as written. Shelves, S1 to S7. */
    "Table": "Tabela",
    "Shelves": "Półki",
    "Alt+Left or Alt+Right moves it to the next category.": "Alt+strzałka w lewo lub w prawo przenosi kartę do sąsiedniej kategorii.",
    "Moved “{TITLE}” to “{CATEGORY}”.": "Przeniesiono kartę „{TITLE}” do kategorii „{CATEGORY}”.",
    "Found: {CARDS}, in one category.": "Znaleziono: {CARDS}; kategorie: 1.",
    "Found: {CARDS}, in {N} categories.": "Znaleziono: {CARDS}; kategorie: {N}.",
    /* In the margin, N1 to N10; N2 and N9 are the lint's own, already here. The kind names follow "jak" as written. */
    "Reads like {KIND}.": "Brzmi jak {KIND}.",
    "If the card commits the firm, mark it, and desks show it with a stamp.": "Jeśli karta zobowiązuje firmę, warto ją oznaczyć: stanowiska pokażą ją wtedy z pieczątką.",
    "Mark as a commitment": "Oznacz jako zobowiązanie",
    "Not a commitment": "To nie zobowiązanie",
    "{AT} of {ALL} · F8: next": "{AT} z {ALL} · F8: następna",
    "Marked as a commitment. Still to answer: {N}. F8: next": "Oznaczono jako zobowiązanie. Do rozstrzygnięcia: {N}. F8: następna",
    "Noted: not a commitment. Still to answer: {N}. F8: next": "Odnotowano: to nie zobowiązanie. Do rozstrzygnięcia: {N}. F8: następna",
    "Every finding is answered.": "Wszystkie uwagi są rozstrzygnięte.",
    "Finding {AT} of {ALL}: “{TITLE}”, {CODE} text.": "Uwaga {AT} z {ALL}: „{TITLE}”, tekst {CODE}.",
    /* By kind, K1 to K17; K1, K6 and K15 are already here. The counted forms of a finding (uwaga) and of a kind in
     * the locative are this seat's, from her notes to N5 and K3; the quotation marks around a phrase and the undo bar's
     * line after a mark, which is K16's first sentence, likewise. */
    "{FINDINGS} in {KINDS}.": "{FINDINGS} w {KINDS}.",
    "{N} finding": "{N} uwaga",
    "{N} findings": "{N} uwag",
    "{N} kind": "{N} rodzaju",
    "{N} kinds": "{N} rodzajach",
    "Open a kind, untick what is not a commitment, and mark the rest in one press.": "W każdym rodzaju wystarczy odznaczyć to, co nie jest zobowiązaniem, i oznaczyć resztę jednym kliknięciem.",
    "By kind": "Według rodzaju",
    "One list": "Jedna lista",
    "Arrange": "Układ",
    "“{PHRASE}”": "„{PHRASE}”",
    "{PHRASE}, and {N} more": "{PHRASE} i jeszcze {N}",
    "{LEFT} of {ALL}": "{LEFT} z {ALL}",
    "Answered: {SEALED} commitments, {NOT} not.": "Rozstrzygnięte. Zobowiązania: {SEALED}, inne: {NOT}.",
    "Answered: {SEALED} commitments.": "Rozstrzygnięte. Zobowiązania: {SEALED}.",
    "Mark the ticked as commitments": "Oznacz zaznaczone jako zobowiązania",
    "None are commitments": "To nie są zobowiązania",
    "The rest are not commitments": "Pozostałe to nie zobowiązania",
    "Unticked: {N}. They stay, to be answered one by one.": "Odznaczone: {N}. Zostają do rozstrzygnięcia pojedynczo.",
    "Commitment: “{PHRASE}”": "Zobowiązanie: „{PHRASE}”",
    "Marked as commitments: {N}. Still to answer: {M}.": "Oznaczono jako zobowiązania: {N}. Do rozstrzygnięcia: {M}.",
    "Noted as not commitments: {N}. Still to answer: {M}.": "Odnotowano, że to nie zobowiązania: {N}. Do rozstrzygnięcia: {M}.",
    "Marked as commitments: {N}.": "Oznaczono jako zobowiązania: {N}.",
    /* The tray, Y1 to Y13; Y1, Y3's reused four, Y6, Y7, Y9 and Y12 are already here. */
    "Replace in these": "Zamień w zaznaczonych",
    "Kept through searches": "Zaznaczenie zostaje przy każdym wyszukiwaniu",
    "Untick all": "Odznacz wszystkie",
    "Untick “{TITLE}”": "Odznacz kartę „{TITLE}”",
    "Find in the ticked cards": "Szukaj w zaznaczonych kartach",
    "Ticked: {CARDS}": "Zaznaczone: {CARDS}",
    "{PLACES} in {N} of the {M} ticked cards": "{PLACES} w {N} z {M} zaznaczonych kart",
    "{PLACES} in the one ticked card": "{PLACES} w jedynej zaznaczonej karcie",
    "Ticked “{TITLE}”. Ticked in all: {N}.": "Zaznaczono kartę „{TITLE}”. Zaznaczone razem: {N}.",
    /* Since the last edition, C1 to C23; C1, C4, C6, C9, C14, C15, C20 and C21 are already here. Four lines of the list
     * are this seat's, for changes her rows do not name: a card added, restored or otherwise changed, and the quick facts. */
    "{CHANGES} since rev {REV}": "{CHANGES} od wersji {REV}",
    "The draft is the same as rev {REV}": "Szkic jest taki sam jak wersja {REV}",
    "Each change can be undone on its own; together they make rev {NEXT}.": "Każdą zmianę można cofnąć osobno; razem złożą się na wersję {NEXT}.",
    "Edited the {LANG} of “{TITLE}”": "Zmieniono tekst {CODE} karty „{TITLE}”",
    "Replaced “{WAS}” with “{NOW}”": "Zamieniono „{WAS}” na „{NOW}”",
    "Marked “{TITLE}” as a commitment": "Oznaczono kartę „{TITLE}” jako zobowiązanie",
    "Retired the card “{TITLE}”": "Wycofano kartę „{TITLE}”",
    "{N} word": "{N} słowo",
    "{N} words": "{N} słów",
    "{PLACES} in {N} card": "{PLACES} w {N} karcie",
    "{PLACES} in {N} cards": "{PLACES} w {N} kartach",
    "Undo here": "Cofnij w tym miejscu",
    "undone": "cofnięte",
    "and {PLACES} more": "i jeszcze {PLACES}",
    "{TITLE}, from “{FROM}” to “{TO}”": "{TITLE}, z kategorii „{FROM}” do „{TO}”",
    "A new change: {LINE}": "Nowa zmiana: {LINE}",
    "Undone: {LINE}": "Cofnięto: {LINE}",
    "Added the card “{TITLE}”": "Dodano kartę „{TITLE}”",
    "Restored the card “{TITLE}”": "Przywrócono kartę „{TITLE}”",
    "Changed the card “{TITLE}”": "Zmieniono kartę „{TITLE}”",
    "Edited the quick facts": "Zmieniono szybkie fakty",
    "Changed the categories": "Zmieniono kategorie",
    "Changed the intents": "Zmieniono intencje",
    "Changed the languages": "Zmieniono języki",
    "Changed the variables": "Zmieniono zmienne",
    "Changed the catalog beyond its cards": "Zmieniono katalog poza kartami",

    /* The object menus, the rename in place and a project moved to the Recycle Bin (board 901). Drafted with the build,
       each Polish line written from what the row does rather than from the English; the copywriter's to replace. */
    "Actions": "Działania",
    "Show in folder": "Pokaż w folderze",
    "Copy the name": "Kopiuj nazwę",
    "Copy the path": "Kopiuj ścieżkę",
    "Copy the title": "Kopiuj tytuł",
    "Copy the text": "Kopiuj treść",
    "Copy the id": "Kopiuj identyfikator",
    "Copy the finding": "Kopiuj uwagę",
    "Copy the card's title": "Kopiuj tytuł karty",
    "Open the card": "Otwórz kartę",
    "Copy the code": "Kopiuj kod",
    "Copy the key": "Kopiuj klucz",
    "Copy the variable": "Kopiuj zmienną",
    "Copy the change": "Kopiuj opis zmiany",
    "Show the change": "Pokaż zmianę",
    "Copied.": "Skopiowano.",
    /* The sign-in's Copy button, for a moment after a copy (ui/app.js signInCopyBtn): a label, no full stop. */
    "Copied": "Skopiowano",
    "Nothing was copied.": "Nic nie skopiowano.",
    "Rename": "Zmień nazwę",
    "Close the other catalogs": "Zamknij pozostałe katalogi",
    "Move to the Recycle Bin": "Przenieś do Kosza",
    "Pick for comparing": "Wybierz do porównania",
    "Leave out of the comparison": "Usuń z porównania",
    "Card title": "Tytuł karty",
    "Enter keeps the name, Esc leaves it as it was.": "Enter zatwierdza nazwę, Esc zostawia ją bez zmian.",
    "Removed “{NAME}”. Its folder goes to the Recycle Bin.": "Usunięto „{NAME}”. Folder katalogu trafi do Kosza.",
    "“{NAME}” is back.": "Katalog „{NAME}” wrócił na listę.",
    "{NAME} could not be moved to the Recycle Bin, so it stays where it is.":
      "Nie udało się przenieść katalogu {NAME} do Kosza, więc został na miejscu.",
    "{NAME} is not a catalog in Studio's catalogs folder, so it stays where it is.":
      "{NAME} nie jest katalogiem z folderu katalogów Studia, więc zostaje tam, gdzie jest.",
    "The folder the team reads from is inside {NAME}, so the catalog stays where it is.":
      "Folder, z którego czyta zespół, leży wewnątrz katalogu {NAME}, więc katalog zostaje na miejscu.",
    "The folder the team of {OTHER} reads from is inside {NAME}, so the catalog stays where it is.":
      "Folder, z którego czyta zespół katalogu {OTHER}, leży wewnątrz katalogu {NAME}, więc katalog zostaje na miejscu.",
    "{P} is not there any more.": "Tego już tu nie ma: {P}.",

    /* THE LICENCE COVER AND ITS REFUSALS (board 936, S6): A DRAFT, the engineer's, written from purpose in both languages,
       for the copywriter to replace. "Miejsce" is a seat and "stanowisko" a desk, as everywhere here; the relay is
       "przekaźnik Etiudy", as the team cover has it. The refusals are the shell's (shell/main.js LICENCE_SAID). */
    "Licence…": "Licencja…",
    "Licence": "Licencja",
    "The Etiuda relay": "Przekaźnik Etiudy",
    "Not open for this Studio": "Nieotwarty dla tego Studia",
    "Open until {DATE}": "Otwarty do {DATE}",
    "Open until {DATE}, for the trial": "Otwarty do {DATE}, na okres próbny",
    "The quiet check renews it while the licence is paid.": "Ciche sprawdzenie przedłuża go, dopóki licencja jest opłacona.",
    "Checked": "Sprawdzono",
    "not yet": "jeszcze nie",
    "Check now": "Sprawdź teraz",
    /* WHERE A TEAM ON THE RELAY STANDS (board 935, G2 on Studio's side): Claudette's words, 2026-10-25, in both languages. Each says
       the step, what comes next with its dates, that nothing on the desks or in Studio goes, and where a licence is renewed; the
       Polish keeps to no second person and puts every date behind "dnia". */
    "This team's relay licence ended on {UNTIL}. Its teammates work as before until {READONLY}; after that they can only read what is on the relay, and on {SWEPT} the relay deletes the team's copy. Nothing on the team's computers or in Studio is ever deleted. A licence is renewed from the Menu, under Settings, then Account.":
      "Licencja przekaźnika dla tego zespołu wygasła dnia {UNTIL}. Do dnia {READONLY} zespół działa jak dotąd; potem mogą tylko odczytywać to, co jest na przekaźniku, a dnia {SWEPT} przekaźnik usunie kopię zespołu. Z komputerów zespołu i ze Studia nic nie zostanie usunięte. Licencję odnawia się z menu, w Ustawieniach, w części Konto.",
    /* Read-only, a licence's or a trial's lapse and the deletion are said in parts: the sentence with a date that stands alone is a
       string of its own, left out where the relay told no such date (ui/app.js lapseSaid). Her words, split at her own full stops. */
    "This team's relay licence ended on {UNTIL}, and since {READONLY} the relay is read-only: nothing new passes through it, from Studio or from a teammate, so publishing waits for the renewal.":
      "Licencja przekaźnika dla tego zespołu wygasła dnia {UNTIL}, a od dnia {READONLY} przekaźnik działa tylko do odczytu: nic nowego przez niego nie przechodzi, ani ze Studia, ani od członków zespołu, więc publikacja czeka na odnowienie.",
    "On {SWEPT} the relay deletes the team's copy.": "Dnia {SWEPT} przekaźnik usunie kopię zespołu.",
    "Nothing on the team's computers or in Studio is ever deleted. A licence is renewed from the Menu, under Settings, then Account.":
      "Z komputerów zespołu i ze Studia nic nie zostanie usunięte. Licencję odnawia się z menu, w Ustawieniach, w części Konto.",
    "This team's licence or trial for the relay ended on {UNTIL}, and the relay no longer carries its editions.":
      "Licencja albo okres próbny przekaźnika dla tego zespołu skończyły się dnia {UNTIL} i przekaźnik nie przenosi już jego wydań.",
    "Nothing on the team's computers or in Studio is ever deleted. To keep the team on the relay, this Studio needs a licence: signing in, from the Menu, under Settings, then Account, brings one.":
      "Z komputerów zespołu i ze Studia nic nie zostanie usunięte. Aby zespół został na przekaźniku, to Studio potrzebuje licencji: daje ją zalogowanie się z menu, w Ustawieniach, w części Konto.",
    "The relay deleted this team's copy on {SWEPT}, after its licence ended.": "Przekaźnik usunął kopię zespołu dnia {SWEPT}, po wygaśnięciu licencji.",
    "Nothing on the team's computers or in Studio was deleted.": "Z komputerów zespołu i ze Studia nic nie zostało usunięte.",
    /* A first create refused because another key already holds the team's id: Claudette's words. */
    "This team could not be set up on the relay: its place there is already held by another key. Make the team again, which gives it a new place, and invite its teammates. Nothing on the team's computers or in Studio has been deleted.":
      "Nie udało się założyć tego zespołu na przekaźniku: jego miejsce zajmuje już tam inny klucz. Trzeba utworzyć zespół od nowa, co da mu nowe miejsce, i zaprosić członków zespołu. Z komputerów zespołu i ze Studia nic nie zostało usunięte.",
    /* Claudette's words, 2026-10-27. */
    "This team's place on the relay belongs to the signing key of the computer that made it, and this computer has a key of its own. To work with the team here, restore that key's backup copy from the Menu, under Settings, then Signing key, and then press Check now, under Settings, then Licence. If this computer is to lead with its own key instead, press Start a new team here on the Team screen and invite its teammates anew. Nothing on the team's computers or in Studio has been deleted.":
      "Miejsce tego zespołu na przekaźniku należy do klucza podpisu komputera, na którym zespół powstał, a ten komputer ma własny klucz. Aby pracować tu z zespołem, należy przywrócić kopię zapasową tamtego klucza z menu, w Ustawieniach, w części Klucz podpisu, a potem nacisnąć Sprawdź teraz w części Licencja. Jeśli ten komputer ma prowadzić zespół własnym kluczem, wystarczy nacisnąć Załóż tu nowy zespół na ekranie Zespół i zaprosić członków zespołu od nowa. Nic na komputerach zespołu ani w Studiu nie zostało usunięte.",
    /* A team whose place on the relay another key took after its sweep: Claudette's words, with the renewal and without it. */
    "The licence is renewed, but this team could not be brought back to the relay: since its copy was deleted, its place there has been taken by another key. To carry on through the relay, make the team again and invite its teammates anew. Nothing on the team's computers or in Studio has been deleted.":
      "Licencja jest odnowiona, ale tego zespołu nie udało się przywrócić na przekaźnik: od czasu usunięcia jego kopii jego miejsce zajął tam inny klucz. Aby dalej korzystać z przekaźnika, trzeba utworzyć zespół od nowa i ponownie zaprosić członków zespołu. Z komputerów zespołu i ze Studia nic nie zostało usunięte.",
    "This team could not be brought back to the relay: since its copy was deleted, its place there has been taken by another key. To carry on through the relay, make the team again and invite its teammates anew. Nothing on the team's computers or in Studio has been deleted.":
      "Tego zespołu nie udało się przywrócić na przekaźnik: od czasu usunięcia jego kopii jego miejsce zajął tam inny klucz. Aby dalej korzystać z przekaźnika, trzeba utworzyć zespół od nowa i ponownie zaprosić członków zespołu. Z komputerów zespołu i ze Studia nic nie zostało usunięte.",
    /* The relay refused the key that signed this team's grant. Claudette's words, by state: fetching, then nothing found yet. */
    "The relay no longer accepts the key that signed this team's relay licence, so Studio is fetching a new licence from the licence service. This normally takes minutes, at most an hour, and nothing needs doing here. Until then the team keeps working with the catalog it has, but nothing new reaches it through the relay, and Studio cannot publish through it.":
      "Przekaźnik nie przyjmuje już klucza, którym podpisano licencję przekaźnika dla tego zespołu, więc Studio pobiera nową licencję z usługi licencji. Zwykle trwa to kilka minut, najwyżej godzinę, i nic nie trzeba robić. Do tego czasu zespół działa na katalogu, który ma, ale nic nowego nie dociera do niego przez przekaźnik, a Studio nie może przez niego publikować.",
    "The relay no longer accepts the key that signed this team's relay licence, and Studio could not get a new licence for it yet. Check now, under Menu, then Settings, then Licence, tries again; if it still finds none, write to us through etiuda.dev. Until then the team keeps working with the catalog it has, but nothing new reaches it through the relay, and Studio cannot publish through it.":
      "Przekaźnik nie przyjmuje już klucza, którym podpisano licencję przekaźnika dla tego zespołu, a Studio nie zdołało jeszcze pobrać dla niego nowej licencji. Przycisk Sprawdź teraz (menu, Ustawienia, Licencja) próbuje ponownie; jeśli i wtedy jej nie znajdzie, prosimy o wiadomość przez etiuda.dev. Do tego czasu zespół działa na katalogu, który ma, ale nic nowego nie dociera do niego przez przekaźnik, a Studio nie może przez niego publikować.",
    /* After the deletion, what a renewal does (Claude alpha's ruling of 2026-10-25, option (b)): Claudette's words. */
    "Renewing the licence brings the team back: at the next sync Studio puts it on the relay again with its latest edition, and the teammates on the team's list rejoin by themselves. To renew: Menu, then Settings, then Licence.":
      "Po odnowieniu licencji zespół wróci sam: przy następnej synchronizacji Studio ponownie umieści go na przekaźniku z najnowszym wydaniem, a członkowie z listy zespołu dołączą sami. Licencję można odnowić z menu, w Ustawieniach, w części Licencja.",
    "A team on the relay": "Zespół na przekaźniku",
    /* A key made again: the licence follows it, the relay team does not (the test architect's E2 on G2); Claudette's words. */
    "This Studio's signing key has changed since its licence was issued. Signing in again moves the licence to the new key: Use another account, under Account, signs in afresh, with the same account or another. A team on the relay stays with the key it was made with until it is handed to the new one on the Team screen, which needs the old key; without it, restore that key's backup copy from the Menu, under Settings, then Signing key, or make the team again and invite its teammates anew.":
      "Klucz podpisu tego Studia zmienił się od wydania jego licencji. Ponowne zalogowanie się przeniesie licencję na nowy klucz: Użyj innego konta, w części Konto, loguje od nowa, tym samym kontem albo innym. Zespół na przekaźniku zostaje jednak przy kluczu, z którym go utworzono, dopóki nie zostanie przekazany nowemu kluczowi na ekranie Zespół, do czego potrzebny jest stary klucz. Bez niego trzeba przywrócić kopię zapasową tamtego klucza z menu, w Ustawieniach, w części Klucz podpisu, albo utworzyć zespół od nowa i ponownie zaprosić członków zespołu.",
    /* Handing a team to the new signing key (board 931 (7)); Claudette's words, 2026-10-29. */
    "Hand the team to the new signing key": "Przekaż zespół nowemu kluczowi podpisu",
    "Hand the team to the new signing key?": "Przekazać zespół nowemu kluczowi podpisu?",
    "The team moves to this Studio's new signing key and keeps its paid time. Studio signs the handover with the old key, which stays set aside on this computer, and the team follows it on its own: nothing needs doing on any computer, and nobody joins again. If the old key may be in someone else's hands, a handover does not shut it out; that calls for a new team, as for a leaked key.":
      "Zespół przejdzie pod nowy klucz podpisu tego Studia i zachowa opłacony czas. Studio podpisze przekazanie starym kluczem, który zostaje odłożony na tym komputerze, a zespół sam za nim podąży: na żadnym komputerze nie trzeba nic robić ani dołączać ponownie. Jeśli stary klucz mógł trafić w cudze ręce, przekazanie go nie odetnie; wtedy potrzebny jest nowy zespół, jak przy wycieku klucza.",
    "The team moves to this Studio's new signing key. Studio signs the handover with the old key, which stays set aside on this computer, and the team follows it on its own: nothing needs doing on any computer, and nobody joins again. If the old key may be in someone else's hands, a handover does not shut it out; that calls for a new team, as for a leaked key.":
      "Zespół przejdzie pod nowy klucz podpisu tego Studia. Studio podpisze przekazanie starym kluczem, który zostaje odłożony na tym komputerze, a zespół sam za nim podąży: na żadnym komputerze nie trzeba nic robić ani dołączać ponownie. Jeśli stary klucz mógł trafić w cudze ręce, przekazanie go nie odetnie; wtedy potrzebny jest nowy zespół, jak przy wycieku klucza.",
    "Hand over": "Przekaż",
    /* The handover asks why (Max's ruling of 2026-11-01 06:13); Claudette's words, 2026-11-01. */
    "Why is the team moving to the new key?": "Dlaczego zespół przechodzi pod nowy klucz?",
    "A new computer": "Nowy komputer",
    "The old key is safe and the team simply moves on. Every teammate follows on its own, those switched off at the time included.":
      "Stary klucz jest bezpieczny, a zespół po prostu przechodzi dalej. Każdy członek zespołu sam za nim podąży, również ci, których komputery są w tym czasie wyłączone.",
    "The old key may be in other hands": "Stary klucz mógł trafić w cudze ręce",
    "Studio guards the team's keys anew, so once they next change, the old key opens nothing published after that. A teammate switched off across the handover and that change will need a new invitation, and Studio names each one. The old key can still sign, so if it is surely in other hands, a new team is the safe way.":
      "Studio zabezpieczy klucze zespołu od nowa, więc gdy następnym razem się zmienią, stary klucz nie otworzy niczego, co zostanie opublikowane potem. Członek zespołu wyłączony w czasie przekazania i tej zmiany będzie potrzebował nowego zaproszenia, a Studio wskaże każde z nazwy. Stary klucz nadal może jednak podpisywać, więc jeśli na pewno jest w cudzych rękach, bezpieczną drogą jest nowy zespół.",
    "These teammates have not taken the change and will need a new invitation: {NAMES}.":
      "Nowego zaproszenia będą potrzebować ci, którzy nie przyjęli zmiany: {NAMES}.",
    "Every teammate has taken the change, so none needs a new invitation.":
      "Cały zespół przyjął zmianę, więc nikt nie potrzebuje nowego zaproszenia.",
    "Handing the team to the new signing key. If Studio closes before this ends, it carries on from where it stopped when it next starts.":
      "Trwa przekazywanie zespołu nowemu kluczowi podpisu. Jeśli Studio zamknie się wcześniej, po ponownym uruchomieniu dokończy od miejsca, w którym przerwało.",
    "The team is handed to the new signing key. The team follows it on its own, with nothing to do; the old key stays set aside on this computer.":
      "Zespół przekazano nowemu kluczowi podpisu. Zespół sam za nim podąży i nic nie trzeba robić; stary klucz zostaje odłożony na tym komputerze.",
    "The relay no longer keeps this team, as its licence has ended, so it was not handed over and nothing changed. To go on with the new key, sign in with an account that holds a licence, from the Menu, under Settings, then Account, and start a new team here on the Team screen.":
      "Przekaźnik nie prowadzi już tego zespołu, bo jego licencja dobiegła końca, więc zespołu nie przekazano i nic się nie zmieniło. Aby pracować dalej z nowym kluczem, trzeba zalogować się kontem z licencją, z menu, w Ustawieniach, w części Konto, i założyć tu nowy zespół na ekranie Zespół.",
    "The licence service gave no licence for the new key, so the team was not handed over and stays as it was, under the old key. Signing in again moves the licence to the new key: Use another account, under the Menu, Settings, then Account, signs in afresh, with the same account or another. Then hand the team over again, and if that is refused too, write to us through etiuda.dev.":
      "Usługa licencji nie wydała licencji dla nowego klucza, więc zespołu nie przekazano; zostaje bez zmian, przy starym kluczu. Ponowne zalogowanie się przeniesie licencję na nowy klucz: Użyj innego konta, z menu, w Ustawieniach, w części Konto, loguje od nowa, tym samym kontem albo innym. Potem można przekazać zespół ponownie, a jeśli i to zostanie odrzucone, napisać do nas przez etiuda.dev.",
    "The new signing key already leads 25 teams on the relay, the most it may, so this team was not handed over and stays as it was, under the old key. A place frees when the relay deletes a team's copy after its licence ends, or write to us through etiuda.dev.":
      "Nowy klucz podpisu prowadzi już na przekaźniku 25 zespołów, czyli najwięcej, ile może, więc tego zespołu nie przekazano; zostaje bez zmian, przy starym kluczu. Miejsce zwalnia się, gdy przekaźnik usunie kopię zespołu po wygaśnięciu jego licencji; można też napisać do nas przez etiuda.dev.",
    "The relay did not take the handover just now, so the team stays as it was, under the old key. Nothing is lost; hand the team over again shortly.":
      "Przekaźnik nie przyjął teraz przekazania, więc zespół zostaje bez zmian, przy starym kluczu. Nic nie przepadło; można spróbować ponownie za chwilę.",
    "On the relay the new signing key already leads the team, but the team file is not yet signed under it: that last step needs the old signing key, which is no longer on this computer. Once the old key's backup copy is restored, from the Menu, under Settings, then Signing key, Studio signs the team file and the handover ends.":
      "Na przekaźniku zespół prowadzi już nowy klucz podpisu, ale plik zespołu nie jest jeszcze pod nim podpisany: ten ostatni krok wymaga starego klucza podpisu, którego nie ma już na tym komputerze. Po przywróceniu kopii zapasowej starego klucza, z menu, w Ustawieniach, w części Klucz podpisu, Studio podpisze plik zespołu i przekazanie się zakończy.",
    /* draft words: copywriter */
    "This new signing key has already been used elsewhere, so this team's keys cannot move under it, and nothing was changed. Make a fresh key for the handover from the Menu, under Settings, then Signing key, with Set this key aside and make a new one; or, if the old key may be in other hands, choose that answer instead.":
      "Ten nowy klucz podpisu był już używany gdzie indziej, więc klucze tego zespołu nie mogą pod nim przejść i nic nie zmieniono. Świeży klucz do przekazania można utworzyć z menu, w Ustawieniach, w części Klucz podpisu, przyciskiem Odłóż ten klucz i utwórz nowy; a jeśli stary klucz mógł trafić w cudze ręce, wystarczy wybrać tę odpowiedź.",
    "This team has already been led by that signing key. A handover cannot return to a key already in the chain; nothing was changed.":
      "Ten zespół był już prowadzony przez ten klucz podpisu. Przekazanie nie może wrócić do klucza będącego już w łańcuchu; nic nie zmieniono.",
    "This team has been handed to a new key 8 times, the most a team can be. A further key leads a new team: on the Team screen, Start a new team here. Nothing was changed.":
      "Ten zespół przekazano już nowemu kluczowi 8 razy, czyli najwięcej, ile można. Kolejny klucz może prowadzić nowy zespół: na ekranie Zespół, Załóż tu nowy zespół. Nic nie zmieniono.",
    "Set this key aside and make a new one":
      "Odłóż ten klucz i utwórz nowy",
    /* Sign-in in place of the purchase key, the address's code and the trial by code: the copywriter's words, 2026-11-13. */
    "The licence service did not accept this, so nothing was changed. Try again; if it happens again, write to us through etiuda.dev.":
      "Usługa licencji tego nie przyjęła, więc nic się nie zmieniło. Można spróbować ponownie; jeśli to się powtórzy, prosimy o wiadomość przez etiuda.dev.",
    "Licences are now held by signing in. This Studio's licence file stays where it is but no longer counts: publishing needs this Studio signed in, and signing in brings the licence this account holds.":
      "Licencje są teraz utrzymywane przez logowanie. Plik licencji tego Studia zostaje na swoim miejscu, ale już się nie liczy: do publikowania potrzeba zalogowania tego Studia, a logowanie przynosi licencję, którą ma to konto.",
    "the key that signed it was withdrawn by Etiuda": "Etiuda wycofała klucz, którym ją podpisano",
    "This computer's clock is more than five minutes out, so the licence service did not take the request. Once the clock is right, try again.":
      "Zegar tego komputera różni się o ponad pięć minut, więc usługa licencji nie przyjęła prośby. Gdy zegar będzie ustawiony dobrze, można spróbować ponownie.",
    "There have been too many tries in the last hour. Try again later.": "W ostatniej godzinie było za dużo prób. Można spróbować ponownie później.",
    "The licence service answered with nothing this Studio accepts, so nothing was kept. Write to us through etiuda.dev.":
      "Usługa licencji odpowiedziała czymś, czego to Studio nie przyjmuje, więc nic nie zapisano. Prosimy o wiadomość przez etiuda.dev.",
    "The licence service could not be reached, so nothing was changed. Try again later.":
      "Nie udało się połączyć z usługą licencji, więc nic nie zmieniono. Można spróbować ponownie później.",
    /* Sign-in (board 980, stage 2): the copywriter's words in both languages. */
    "This Studio could not renew its sign-in by itself. Sign in again below.":
      "To Studio nie zdołało samo odnowić logowania. Wystarczy zalogować się ponownie poniżej.",
    "That sign-in provider is not offered by this Studio, so nothing was changed.": "To Studio nie oferuje tego dostawcy logowania, więc nic nie zmieniono.",
    "The sign-in was cancelled, so nothing was changed.": "Logowanie anulowano, więc nic nie zmieniono.",
    "No browser could be opened for the sign-in, so nothing was changed. Try again once this computer has a browser set to open links.":
      "Nie udało się otworzyć przeglądarki do logowania, więc nic nie zmieniono. Można spróbować ponownie, gdy ten komputer będzie miał przeglądarkę ustawioną do otwierania łączy.",
    "The sign-in provider ended the sign-in without an answer Studio can use, so nothing was changed. Try again.":
      "Dostawca logowania zakończył je bez odpowiedzi, której Studio może użyć, więc nic nie zmieniono. Można spróbować ponownie.",
    "The browser came back with an answer that was not this sign-in's, so it was not used. Try again.":
      "Przeglądarka wróciła z odpowiedzią, która nie należała do tego logowania, więc jej nie użyto. Można spróbować ponownie.",
    "The sign-in's answer had expired by the time Studio used it, so nothing was changed. Try again.":
      "Odpowiedź logowania wygasła, zanim Studio jej użyło, więc nic nie zmieniono. Można spróbować ponownie.",
    "No sign-in came back from the browser within five minutes, so nothing was changed. Try again.":
      "Przez pięć minut z przeglądarki nie wróciło żadne logowanie, więc nic nie zmieniono. Można spróbować ponownie.",
    "This account's sign-in was not accepted, so nothing was changed. Try again; if it happens again, write to us through etiuda.dev.":
      "Logowania tym kontem nie przyjęto, więc nic nie zmieniono. Można spróbować ponownie, a jeśli to się powtórzy, prosimy o wiadomość przez etiuda.dev.",
    /* A desk's seat (board 980, stage 3): the Desks screen and the shell's refusals. */
    "has a seat": "ma miejsce",
    "seat freed": "miejsce zwolnione",
    "no seat free on the licence": "w licencji brak wolnego miejsca",
    "the person's fourth desk, so no seat": "czwarte stanowisko tej osoby, więc bez miejsca",
    "sign-in not accepted": "logowania nie przyjęto",
    "not signed in": "bez logowania",
    "Free seat": "Zwolnij miejsce",
    "This desk holds no seat to free, so nothing was changed.": "To stanowisko nie ma miejsca do zwolnienia, więc nic nie zmieniono.",
    /* Decision 46, the copywriter's words: the seat stays, and the licence's owner can free it; and this Studio's own lead seat gone. */
    "This Studio may not free this seat, so nothing was changed. The licence's owner can free it.": "To Studio nie może zwolnić tego miejsca, więc nic nie zmieniono. Może je zwolnić osoba, do której należy licencja.",
    "This Studio no longer holds a lead seat on the licence, so nothing was changed. Signing in again, under Account, takes one again where the licence still has one for this account.": "To Studio nie ma już miejsca lidera w licencji, więc nic nie zmieniono. Ponowne zalogowanie się w części Konto znów je daje, jeśli licencja wciąż ma je dla tego konta.",
    /* Sign-in as the person's own (board 980): Studio's door, Settings' Account, the paid acts and the Team screen's list, the
       copywriter's final words (words-signin-screens-2026-11-12). Her rule for Studio is applied where her line names Etiuda doing
       what Studio does ("Studio carries on"); her lead seat line leaves out "All {N} are in use.", which no answer can fill. */
    /* Studio's door (S-3, words-desk-and-studio-door-2026-11-17.md): S1, S3, S5 and placeholders for unworded states. */
    "Etiuda Studio starts with a sign-in.": "Etiuda Studio zaczyna się od zalogowania.",
    "Signing in with Microsoft or Google brings the licence this account holds, or else starts Etiuda Studio's fourteen days. Projects open once that is done.":
      "Zalogowanie kontem Microsoft lub Google daje dostęp do licencji tego konta, a jeśli jej nie ma, rozpoczyna czternaście dni Etiudy Studio. Projekty otwierają się po zalogowaniu.",
    "Etiuda Studio's trial has ended.": "Okres próbny Etiudy Studio się skończył.",
    "It ended on {STUDIO_END}, and no project opens until a licence is bought.":
      "Skończył się {STUDIO_END} i żaden projekt się nie otworzy do czasu zakupu licencji.",
    "Save the drafts as files…": "Zapisz wersje robocze jako pliki…",
    "Each project's current draft can still be saved in a folder of your choice, as a catalog file and its cards as a CSV file. Published editions are already files in each project's archive on this computer.":
      "Bieżącą wersję roboczą każdego projektu można jeszcze zapisać w wybranym folderze jako plik katalogu, a jej karty jako plik CSV. Opublikowane wydania są już plikami w archiwum każdego projektu na tym komputerze.",
    "This account manages the licence but has no seat on it.": "To konto zarządza licencją, ale nie ma w niej miejsca.",
    "Projects open only for an account with a seat. The licence is managed from the card below.":
      "Projekty otwierają się tylko na koncie z miejscem w licencji. Licencją zarządza się na karcie poniżej.",
    /* Placeholders for Studio door states without copywriter sentences (placeholder: Claudette). */
    "The trial ended, and no project opens until a licence is bought.":
      "Okres próbny się skończył i żaden projekt się nie otworzy do czasu zakupu licencji.",
    "No licence is active for this Studio.": "Żadna licencja nie jest aktywna dla tego Studia.",
    /* the copywriter's words (the refused licence file, 2026-11-22) */
    "The licence file {FILE} was refused: {WHY}.": "Plik licencji {FILE} został odrzucony: {WHY}.",
    "The licence file was refused: {WHY}.": "Plik licencji został odrzucony: {WHY}.",
    "the key that signed it has since been withdrawn by Etiuda": "klucz, którym go podpisano, został od tego czasu wycofany przez Etiudę",
    "the key that signed it was not allowed to sign on the day it was issued": "klucz, którym go podpisano, nie mógł podpisywać w dniu jego wystawienia",
    "Etiuda never vouched for the key that signed it": "Etiuda nigdy nie poświadczyła klucza, którym go podpisano",
    "Nothing on this computer can mend this: it needs a newer version of Studio. If none is to hand, write to contact@etiuda.dev.": "Na tym komputerze nie da się tego naprawić: potrzebna jest nowsza wersja Studia. Jeśli jej nie ma, wystarczy napisać na kontakt@etiuda.dev.",
    "Check now asks for a licence this version reads. If none comes, write to contact@etiuda.dev.": "Sprawdź teraz prosi o licencję, którą ta wersja czyta. Jeśli żadna nie przyjdzie, wystarczy napisać na kontakt@etiuda.dev.",
    "Check now asks for a fresh licence, and so does signing in again. If the new one is refused too, write to contact@etiuda.dev with this message.": "Sprawdź teraz prosi o nową licencję, podobnie jak ponowne zalogowanie. Jeśli i nowa zostanie odrzucona, wystarczy napisać na kontakt@etiuda.dev, podając ten komunikat.",
    "This account holds no licence on this computer. No project opens until a licence is held.":
      "To konto nie ma licencji na tym komputerze. Żaden projekt się nie otworzy, dopóki nie ma licencji.",
    "Studio cannot open projects in this state ({STATUS}).": "Studio nie może otworzyć projektów w tym stanie ({STATUS}).",
    "What happens": "Co się stanie",
    "Where it stopped": "Gdzie się zatrzymało",
    "The browser opens the sign-in page": "W przeglądarce otwiera się strona logowania",
    "You choose your account there": "Tam wybiera się konto",
    "Studio carries on here by itself": "Studio samo przechodzi dalej",
    "No licence key to keep": "Bez klucza licencji do pilnowania",
    "Signing in": "Logowanie",
    "Signing in gives this account its Studio seat, on any computer it signs in on, up to three.":
      "Logowanie daje temu kontu miejsce w Studiu, na każdym komputerze, na którym się zaloguje, najwyżej na trzech.",
    "Sign in with Microsoft": "Zaloguj się za pomocą konta Microsoft",
    "Sign in with Google": "Zaloguj się przez Google",
    /* The sign-in lab's provider (src/signin-lab.cjs), drawn only in a development Studio: placeholder: Claudette. */
    "Sign in with {PROVIDER}": "Zaloguj się przez {PROVIDER}",
    "Microsoft: a work, school or personal account.": "Microsoft: konto służbowe, szkolne lub osobiste.",
    "Google: a Workspace or personal account.": "Google: konto Workspace lub osobiste.",
    "Finish signing in in the browser": "Logowanie trwa w przeglądarce",
    "Waiting for {PROVIDER}; Studio carries on by itself when you come back.": "Oczekiwanie na {PROVIDER}; Studio samo przejdzie dalej po powrocie.",
    "Open the browser again": "Otwórz przeglądarkę ponownie",
    "The sign-in service could not be reached.": "Nie udało się połączyć z usługą logowania.",
    "Nothing changed: this computer is not signed in, and Studio works as before.": "Nic się nie zmieniło: ten komputer nie jest zalogowany, a Studio działa jak dotąd.",
    "This account's organisation has not allowed Etiuda at its sign-in provider.": "Organizacja tego konta nie dopuściła Etiudy u swojego dostawcy logowania.",
    "Its IT department can allow it; another account can be used meanwhile.": "Może to zmienić jej dział IT; do tego czasu można użyć innego konta.",
    "No Etiuda licence has a seat for this account.": "Żadna licencja Etiudy nie ma miejsca dla tego konta.",
    "This licence has no free lead seat.": "Ta licencja nie ma wolnego miejsca lidera.",
    "The licence's owner can free one in Studio, from the Menu, under Settings, then Account.":
      "Osoba, do której należy licencja, może zwolnić jedno w Studiu, z menu, w Ustawieniach, w części Konto.",
    /* The shell's sentences for the same moments, each the two halves above as one. */
    "This account's organisation has not allowed Etiuda at its sign-in provider. Its IT department can allow it; another account can be used meanwhile.":
      "Organizacja tego konta nie dopuściła Etiudy u swojego dostawcy logowania. Może to zmienić jej dział IT; do tego czasu można użyć innego konta.",
    "No Etiuda licence has a seat for this account. The sign-in worked. A seat comes from a trial, a purchase, or the licence's owner naming this account a lead; another account can be used meanwhile.":
      "Żadna licencja Etiudy nie ma miejsca dla tego konta. Logowanie się udało. Miejsce daje okres próbny, zakup albo wskazanie tego konta jako lidera przez osobę, do której należy licencja; tymczasem można użyć innego konta.",
    "This licence has no free lead seat. The licence's owner can free one in Studio, from the Menu, under Settings, then Account.":
      "Ta licencja nie ma wolnego miejsca lidera. Osoba, do której należy licencja, może zwolnić jedno w Studiu, z menu, w Ustawieniach, w części Konto.",
    "Not signed in": "Bez logowania",
    /* A managed installation (decision 49, held for Max's ruling): the copywriter's words of words-49 and the product designer's
       labels, each sentence without the organisation's name where the licence gives none, and her words for the policy half. */
    "Managed by your organisation": "Zarządzane przez organizację",
    "The organisation decides who uses Etiuda Studio here, and with which account. Its IT department can change that.":
      "Organizacja decyduje, kto korzysta tu z Etiudy Studio i jakim kontem. Zmienić to może jej dział IT.",
    "A shared computer: another person may sign in here, with an account of the organisation.": "Wspólny komputer: może się tu zalogować inna osoba, kontem organizacji.",
    "Sign-in": "Logowanie",
    "{PROVIDER} · work accounts of the organisation": "{PROVIDER} · konta służbowe organizacji",
    "{PROVIDER} · work accounts": "{PROVIDER} · konta służbowe",
    "{PROVIDER} · accounts the organisation allows": "{PROVIDER} · konta dopuszczone przez organizację",
    /* The same, naming the organisation where its signed licence gives the name: "organizacja" before it carries the case (her rule). */
    "{ORG} decides who uses Etiuda Studio here, and with which account. Its IT department can change that.":
      "Organizacja {ORG} decyduje, kto korzysta tu z Etiudy Studio i jakim kontem. Zmienić to może jej dział IT.",
    "A shared computer: another person may sign in here, with an account of {ORG}.": "Wspólny komputer: może się tu zalogować inna osoba, kontem organizacji {ORG}.",
    "{PROVIDER} · work accounts of {ORG}": "{PROVIDER} · konta służbowe organizacji {ORG}",
    "Set by your organisation": "Ustawione przez organizację",
    "Given to this account by your organisation.": "Przydzielone temu kontu przez organizację.",
    "Your organisation has not given this account access to Etiuda.": "Organizacja nie przyznała temu kontu dostępu do Etiudy.",
    "Its IT department can: asking them to assign the account is enough.": "Może to zrobić jej dział IT: wystarczy poprosić o przypisanie konta.",
    "To ask for access: {CONTACT}.": "W sprawie dostępu: {CONTACT}.",
    "This account has no Etiuda role in its organisation, so it holds no seat.": "To konto nie ma w swojej organizacji żadnej roli w Etiudzie, więc nie zajmuje miejsca w licencji.",
    "Its IT department assigns the roles.": "Role przydziela dział IT organizacji.",
    /* The shell's sentences of the same (shell/main.js LICENCE_SAID). */
    "The organisation has not given this account access to Etiuda, so it cannot sign in. Its IT department can give access.":
      "Organizacja nie przyznała temu kontu dostępu do Etiudy, więc logowanie się nie powiodło. Dostęp może przyznać jej dział IT.",
    "Only the account already signed in can sign in again on this computer, and that was another account, so nothing was changed.":
      "Na tym komputerze może zalogować się ponownie tylko konto, które jest już zalogowane, a wybrano inne, więc nic nie zmieniono.",
    "Set by the organisation's IT department, so it cannot be changed here.": "Ustawione przez dział IT organizacji, więc nie można tego tutaj zmienić.",
    /* The sign-in preview (shell/main.js signInOffer): the copywriter's two lines, the first in its two sentences, the shell's
       refusal the second. */
    "Preview only.": "Tylko podgląd.",
    "Sign-in is not set up yet, so nothing here is sent.": "Logowanie nie jest jeszcze uruchomione, więc nic stąd nie zostanie wysłane.",
    "Sign-in is not set up yet, so nothing was sent. This is a preview.": "Logowanie nie jest jeszcze uruchomione, więc nic nie wysłano. To tylko podgląd.",
    /* The sign-in link while the browser is awaited (ui/app.js signInLinkHtml), the copywriter's line in its two sentences. */
    "Browser did not open?": "Przeglądarka się nie otworzyła?",
    "Paste this link into a browser on this computer.": "Łącze można wkleić w przeglądarkę na tym komputerze.",
    // The copywriter's words of 2026-11-12 (words-signin-screens-2026-11-12.md).
    "No keyring is open on this computer, so the sign-in is not kept: each renewal asks for it again.": "Na tym komputerze nie jest otwarty żaden magazyn kluczy, więc logowanie nie jest zachowywane: każde odnowienie wymaga ponownego logowania.",
    "Sign in": "Zaloguj się",
    "Account": "Konto",
    "Who is signed in to this Studio, and the seat it holds.": "Kto jest zalogowany w tym Studiu i jakie miejsce zajmuje.",
    "Signed in with {PROVIDER}": "Zalogowano przez {PROVIDER}",
    "service not reached just now": "usługa chwilowo nieosiągalna",
    "Use another account": "Użyj innego konta",
    "Sign out": "Wyloguj się",
    "Seat": "Miejsce w licencji",
    "Etiuda Studio, lead seat": "Etiuda Studio, miejsce lidera",
    /* A managed tenant's person with a licence of their own (decision 49): placeholders for the copywriter. */
    "Your organisation's licence follows the roles its IT department assigns, and this account has none, so it keeps its seat on the licence bought before.": "Licencja organizacji wynika z ról przydzielanych przez jej dział IT, a to konto nie ma żadnej, więc zachowuje miejsce w licencji kupionej wcześniej.",
    "Your organisation has given this account a role, so it uses the organisation's licence; its seat on the licence bought before is not used meanwhile.": "Organizacja przydzieliła temu kontu rolę, więc korzysta ono z licencji organizacji; jego miejsce w licencji kupionej wcześniej nie jest do tego czasu używane.",
    "Held by this account, on up to three computers.": "Przypisane do tego konta, na najwyżej trzech komputerach.",
    "Last checked": "Ostatnie sprawdzenie",
    "The sign-in service cannot be reached just now. Studio keeps working with the catalogs it has.":
      "Usługa logowania jest teraz nieosiągalna. Studio działa dalej na katalogach, które już ma.",
    "{HELD} of {OF} in use": "zajęte: {HELD} z {OF}",
    "this Studio · owner": "to Studio · licencja tego konta",
    "free": "wolne",
    "Freeing a seat is immediate and asks nothing more. That Studio is signed out at its next check; its catalogs and teams stay where they are, and the seat is free for another account.":
      "Zwolnienie miejsca działa od razu i o nic więcej nie pyta. Tamto Studio zostanie wylogowane przy najbliższym sprawdzeniu; jego katalogi i zespoły zostają na miejscu, a miejsce jest wolne dla innego konta.",
    "Seat freed just now. {NAME} can take a seat again by signing in, while one is free.":
      "Miejsce zwolnione przed chwilą. {NAME} może zająć miejsce ponownie, logując się, o ile któreś będzie wolne.",
    "Seat freed just now. That account can take a seat again by signing in, while one is free.":
      "Miejsce zwolnione przed chwilą. To konto może zająć miejsce ponownie, logując się, o ile któreś będzie wolne.",
    "Account settings": "Ustawienia konta",
    "Publishing to a team waits for sign-in.": "Publikowanie dla zespołu czeka na logowanie.",
    "Statistics wait for sign-in.": "Statystyki czekają na logowanie.",
    "Taking proposals waits for sign-in.": "Przyjmowanie propozycji czeka na logowanie.",
    "Answering flags waits for sign-in.": "Odpowiadanie na zgłoszenia czeka na logowanie.",
    "Studio works once you are signed in under a trial or a licence, so nothing was done.":
      "Studio działa, gdy jesteś zalogowany z okresem próbnym lub licencją, więc nic nie zostało zrobione.",
    "People of your organisation who signed in": "Osoby z organizacji, które się zalogowały",
    "Admit ##person": "Przyjmij",
    /* The admitted row on a relay team, the copywriter's relay case (words-studio-placeholders-7c17a75d): true while a new computer
       still finds a relay team by an invitation, the way it learns the team's door being still to be ruled. */
    "Admitted to the licence. On the relay, each new computer {NAME} uses still joins by an invitation.":
      "Przyjęto do licencji. Na przekaźniku każdy nowy komputer, którego używa {NAME}, nadal dołącza przez zaproszenie.",
    "Admitted to the licence. On the relay, each new computer this account uses still joins by an invitation.":
      "Przyjęto do licencji. Na przekaźniku każdy nowy komputer tego konta nadal dołącza przez zaproszenie.",
    /* The copywriter's words for the heading, the paid act's second half, the admitted row and the lead's refusal. */
    "The sign-in did not finish.": "Logowanie nie dobiegło końca.",
    "today, {TIME}": "dziś, {TIME}",
    "The naming could not be withdrawn, so nothing has changed.": "Nie udało się wycofać wskazania, więc nic się nie zmieniło.",
    "This person could not be confirmed as lead, so nothing has changed.": "Nie udało się potwierdzić tej osoby jako lidera, więc nic się nie zmieniło.",
    "Inviting people needs this Studio signed in and this catalog shared with a team, so nobody was invited.":
      "Do zapraszania osób potrzeba, by to Studio było zalogowane, a ten katalog udostępniony zespołowi, więc nikogo nie zaproszono.",
    "Withdrawing an invitation needs this Studio signed in and this catalog shared with a team, so the invitation still stands.":
      "Do wycofania zaproszenia potrzeba, by to Studio było zalogowane, a ten katalog udostępniony zespołowi, więc zaproszenie nadal obowiązuje.",
    "Confirming people needs this Studio signed in and this catalog shared with a team, so nobody was confirmed.":
      "Do potwierdzania osób potrzeba, by to Studio było zalogowane, a ten katalog udostępniony zespołowi, więc nikogo nie potwierdzono.",
    "Declining a request needs this Studio signed in and this catalog shared with a team, so the request still waits.":
      "Do odrzucenia prośby potrzeba, by to Studio było zalogowane, a ten katalog udostępniony zespołowi, więc prośba nadal czeka.",
    "This team works from a shared folder, so a teammate is invited with a link; nobody was invited by address.":
      "Ten zespół pracuje na wspólnym folderze, więc członka zespołu zaprasza się linkiem; nikogo nie zaproszono przez adres e-mail.",
    "Admitting people needs this Studio signed in and this catalog shared with a team, so nobody was admitted.":
      "Do przyjmowania osób potrzeba, by to Studio było zalogowane, a ten katalog udostępniony zespołowi, więc nikogo nie przyjęto.",
    /* The sign-in's code and the owner's lead seats (decision 15 (b) and (c)): the copywriter's words. A seat is "miejsce w licencji"
       throughout, since "stanowisko" is the desk. */
    "Lead seats on this licence": "Miejsca liderów w tej licencji",
    "signed in {DATE}": "logowanie {DATE}",
    "freed": "zwolnione",
    /* A team is its lead's own (decision 47, held for Max's ruling): the copywriter's,
       2026-11-13. */
    "Your organisation has an Etiuda licence": "Organizacja ma licencję Etiudy",
    /* The named person's own press (board 1011; the copywriter's third piece of 2026-11-20): the bubble from the account button, what it says
       when no lead seat is free, and the row under Seat in Account. */
    "{OWNER} has named this account a lead": "{OWNER} wskazuje to konto jako lidera",
    "On {ORG}'s Etiuda licence; a team is made afterwards, with Make a team.": "Licencja Etiudy organizacji {ORG}; zespół tworzy się potem przyciskiem Utwórz zespół.",
    "Accept, and this Studio moves now onto the licence's paid lead seat; its own trial, until {DATE}, is set aside. Projects stay exactly as they are.": "Po przyjęciu to Studio od razu przechodzi na płatne miejsce lidera w tej licencji, a własny okres próbny, do {DATE}, zostaje odłożony. Projekty zostają dokładnie takie, jakie są.",
    "No lead seat is free on that licence now": "W tej licencji nie ma teraz wolnego miejsca lidera",
    "Every lead seat on {ORG}'s licence is taken, so nothing changed: this Studio stays on its own trial, until {DATE}.": "Wszystkie miejsca liderów w licencji organizacji {ORG} są zajęte, więc nic się nie zmieniło: to Studio zostaje w swoim okresie próbnym, do {DATE}.",
    "{OWNER} is told the seat could not be taken. When one is free, this asks again.": "{OWNER} dostaje informację, że nie udało się zająć miejsca. Gdy jakieś się zwolni, to pytanie pojawi się ponownie.",
    "Named a lead by {OWNER}": "Wskazanie na lidera: {OWNER}",
    "On {ORG}'s licence. Accepting moves this Studio onto its paid lead seat and sets the trial aside; projects stay as they are.": "Licencja organizacji {ORG}. Przyjęcie przenosi to Studio na płatne miejsce lidera i odkłada okres próbny; projekty zostają bez zmian.",
    "Accept…": "Przyjmij…",
    "The licence's owner": "Właściciel licencji",
    /* Account's Seat row for Studio trials (words-separate-trials-2026-11-17.md, states 4, 5, 6 and 6a). */
    "Trial, day {N} of 14": "Okres próbny, dzień {N} z 14",
    "Etiuda Studio's own fourteen days, until {DATE}, on up to three computers.":
      "Własne czternaście dni Etiudy Studio, do {DATE}, najwyżej na trzech komputerach.",
    "Etiuda Studio's own fourteen days, until {STUDIO_END}. Etiuda on this account runs on them too: its own fourteen days ended on {DESK_END}.":
      "Własne czternaście dni Etiudy Studio, do {STUDIO_END}. Etiuda na tym koncie też z nich korzysta: jej własne czternaście dni skończyły się {DESK_END}.",
    "Trial ended": "Okres próbny skończony",
    "Etiuda Studio's trial ended on {STUDIO_END}, and Etiuda's on {DESK_END}. No project opens now; each project's draft can still be saved as a catalog file.":
      "Okres próbny Etiudy Studio skończył się {STUDIO_END}, a Etiudy {DESK_END}. Żaden projekt się teraz nie otwiera; wersję roboczą każdego projektu można jeszcze zapisać jako plik katalogu.",
    "Etiuda Studio's trial ended on {STUDIO_END}. No project opens now; each project's draft can still be saved as a catalog file.":
      "Okres próbny Etiudy Studio skończył się {STUDIO_END}. Żaden projekt się teraz nie otwiera; wersję roboczą każdego projektu można jeszcze zapisać jako plik katalogu.",
    /* Placeholder for trial-ended without an end date (placeholder: Claudette). */
    "Etiuda Studio's trial ended. No project opens now; each project's draft can still be saved as a catalog file.":
      "Okres próbny Etiudy Studio się skończył. Żaden projekt się teraz nie otwiera; wersję roboczą każdego projektu można jeszcze zapisać jako plik katalogu.",
    "Etiuda Studio, lead seat · owner": "Etiuda Studio, miejsce lidera · licencja należy do tego konta",
    /* Buy (board 1020): the copywriter's lines, 2026-11-22, in the
       office. */
    "The order page opens in the browser, and the licence bought there is this account's.":
      "Strona zamówienia otworzy się w przeglądarce, a kupiona tam licencja będzie należeć do tego konta.",
    "This account already pays for its licence, so this opens its subscription at {PROVIDER} instead of a second order; seats are added there.":
      "To konto już płaci za licencję, więc ten przycisk otwiera jego subskrypcję w serwisie {PROVIDER} zamiast drugiego zamówienia; tam dodaje się miejsca.",
    "Add seats…": "Dodaj miejsca…",
    "This account already pays for its licence, and a licence holds one subscription, so no second order is taken.":
      "To konto już płaci za licencję, a jedna licencja ma jedną subskrypcję, więc drugiego zamówienia nie ma.",
    "A second payment from this account, of {DATE}, is held: the licence it already pays for takes more seats at {PROVIDER} instead, and the second payment is refunded.":
      "Druga płatność z tego konta, z {DATE}, jest wstrzymana: licencja, za którą to konto już płaci, przyjmuje dodatkowe miejsca w serwisie {PROVIDER}, a druga płatność zostanie zwrócona.",
    "A payment from this account, of {DATE}, is held, because this account's organisation holds its Etiuda licence. It is refunded or attached by hand, and this line then goes by itself.":
      "Płatność z tego konta, z {DATE}, jest wstrzymana, bo licencję Etiudy dla tego konta ma jego organizacja. Zostanie zwrócona albo przypisana ręcznie, a wtedy ten wiersz sam zniknie.",
    "A payment from this account, of {DATE}, is held for a look by hand. It is refunded or attached to a licence, and this line then goes by itself.":
      "Płatność z tego konta, z {DATE}, jest wstrzymana do ręcznego sprawdzenia. Zostanie zwrócona albo przypisana do licencji, a wtedy ten wiersz sam zniknie.",
    "{PROVIDER} has not yet confirmed this account's payment of {DATE}. The licence comes by itself once it does.":
      "{PROVIDER} nie potwierdził jeszcze płatności tego konta z {DATE}. Licencja przyjdzie sama, gdy to nastąpi.",
    "Licence for a team": "Licencja dla zespołu",
    "Your organisation holds the Etiuda licence for this account, so there is nothing to buy here. Its IT department gives the seat, and Check now looks for it again.":
      "Licencję Etiudy dla tego konta ma organizacja, więc nie ma tu czego kupować. Miejsce daje jej dział IT, a przycisk Sprawdź teraz szuka go ponownie.",
    /* The door where Buy goes nowhere: the copywriter's line (words-studio-buy-2026-11-22.md, addendum). */
    "Buying is not available in this build of Etiuda Studio. A lead seat comes from a licence's owner: a naming sent to this account's email address appears under Account with one Accept, and Check now looks for it again.":
      "W tej wersji Etiudy Studio nie ma zakupu. Miejsce lidera daje właściciel licencji: wskazanie wysłane na adres e-mail tego konta pojawia się w części Konto z jednym przyciskiem Przyjmij, a przycisk Sprawdź teraz szuka go ponownie.",
    "Buy": "Kup",
    "Payment": "Płatność",
    /* A licence whose seats follow Microsoft Entra, and its administrator's view (decision 49, held for Max's ruling): the
       copywriter's words; with no organisation's name to show, a sentence
       keeps "the organisation" / "organizacja", her rule for that case. */
    "Microsoft · work accounts of {ORG}": "Microsoft · konta służbowe organizacji {ORG}",
    "Microsoft · work accounts of the organisation": "Microsoft · konta służbowe organizacji",
    "No seat": "Bez miejsca w licencji",
    "This account administers the licence and writes no catalogs, so it holds no seat.":
      "To konto administruje licencją i nie pisze katalogów, więc nie zajmuje miejsca.",
    "Lead seats": "Miejsca liderów",
    "For the people who keep the wording, in Etiuda Studio.": "Dla osób, które dbają o treść odpowiedzi, w Etiudzie Studio.",
    "Desk seats": "Miejsca dla stanowisk",
    "For the agents, on their desks.": "Dla konsultantów, na ich stanowiskach.",
    "in use: {A} of {B}": "zajęte: {A} z {B}",
    "assigned beyond those bought: {N}. They are seated as seats come free.": "przydzielone ponad kupione: {N}. Te osoby dostaną miejsce, gdy któreś się zwolni.",
    "Paid until": "Opłacona do",
    "Newer versions until": "Nowsze wersje do",
    "Who holds a seat": "Kto zajmuje miejsce",
    "Roles in Microsoft Entra": "Role w Microsoft Entra",
    "Agent, Lead and Administrator are assigned in your organisation's Entra, not here. A person taken off there loses the seat within a week at most.":
      "Role Agent, Lead i Administrator przydziela się w Entra organizacji, nie tutaj. Osoba usunięta tam traci miejsce najpóźniej po tygodniu.",
    "This account has no Etiuda role in its organisation, so it holds no seat. Its IT department assigns the roles.":
      "To konto nie ma w swojej organizacji żadnej roli w Etiudzie, więc nie zajmuje miejsca w licencji. Role przydziela dział IT organizacji.",
    "Seats on this licence follow the roles the organisation's IT department assigns, so nothing was changed here.":
      "Miejsca w tej licencji wynikają z ról przydzielonych przez dział IT organizacji, więc nic tu nie zmieniono.",
    "Removed as lead. Their team is now this Studio's, and its desks keep their seats.": "Usunięto z liderów. Zespół przeszedł do tego Studia, a jego stanowiska zachowują miejsca w licencji.",
    "desks on their team: {N}": "stanowiska w zespole: {N}",
    "named {DATE}": "wskazano {DATE}",
    "named, not signed in yet": "wskazano, jeszcze bez logowania",
    "Remove as lead": "Usuń z liderów",
    "Name as lead": "Wskaż jako lidera",
    /* Board 1017, a lead named and a member invited by email address: the copywriter's words
      (2026-11-22), and the lead engineer's placeholders where marked, for her. */
    "named: {N} of {TOTAL} · waiting: {W}": "wskazani: {N} z {TOTAL} · czekają: {W}",
    "email address, or a name from your teams": "adres e-mail albo osoba z zespołów",
    "On your teams": "W zespołach",
    "\"{TYPED}\" is not an email address yet": "„{TYPED}” nie jest jeszcze adresem e-mail",
    "Invite by email address": "Zaproś adresem e-mail",
    "a colleague's email address": "adres e-mail osoby z zespołu",
    "Invite": "Zaproś",
    "Someone with no address to type?": "Bez adresu do wpisania?",
    "Invited, waiting": "Zaproszenia oczekujące",
    "{ADDRESS} · named {WHEN}": "{ADDRESS} · wskazanie: {WHEN}",
    "{ADDRESS} · invited {WHEN} to {TEAM}": "{ADDRESS} · zaproszenie: {WHEN}, zespół: {TEAM}",
    "waiting for their Join": "czeka, aż ta osoba dołączy",
    "waiting for their Accept": "czeka na przyjęcie przez tę osobę",
    "Withdraw": "Wycofaj",
    "No mail is sent. The person meets the naming the next time they sign in to Studio with this address, and accepts it there; tell them yourself if you like.":
      "Żaden e-mail nie jest wysyłany. Osoba zobaczy wskazanie przy najbliższym logowaniu do Studia tym adresem i tam je przyjmie; można też ją o tym uprzedzić.",
    "No mail is sent. Their desk shows the invitation the next time it signs in with this address, with one Join; tell them yourself if you like.":
      "Żaden e-mail nie jest wysyłany. Stanowisko tej osoby pokaże zaproszenie przy najbliższym logowaniu tym adresem, z jednym przyciskiem Dołącz; można też ją o tym uprzedzić.",
    "Every lead seat on this licence is taken, so a person's Accept waits until one is free or a seat is added.":
      "Wszystkie miejsca liderów w tej licencji są zajęte, więc przyjęcie wskazania czeka, aż któreś się zwolni albo dojdzie nowe miejsce.",
    "accepted {WHEN}": "przyjęcie: {WHEN}",
    "waits for you to confirm": "czeka na potwierdzenie",
    "{PROVIDER} does not vouch for this address, so the seat is taken only once you confirm this is the colleague you named. What {PROVIDER} says of the account:":
      "{PROVIDER} nie poświadcza tego adresu, więc miejsce zostanie zajęte dopiero po potwierdzeniu, że to wskazana osoba. Co {PROVIDER} podaje o koncie:",
    "{PROVIDER} does not vouch for this address, so their desk joins only once you confirm this is the person you invited. What {PROVIDER} says of the account:":
      "{PROVIDER} nie poświadcza tego adresu, więc stanowisko tej osoby dołączy dopiero po potwierdzeniu, że to zaproszona osoba. Co {PROVIDER} podaje o koncie:",
    "Name {PERSON}": "Imię i nazwisko: {PERSON}",
    "Account personal, not an organisation's": "Konto: osobiste, nie organizacji",
    "Account an organisation's": "Konto: organizacji",
    "Decline": "Odrzuć",
    "Confirm as lead": "Potwierdź jako lidera",
    "Confirm and admit": "Potwierdź i przyjmij",
    "The licence's owner names it by this account's email address, and this Studio then asks before moving to the organisation's licence. Until then it sees no team but its own.":
      "Osoba, do której należy licencja, wskazuje je po adresie e-mail tego konta, a to Studio pyta wtedy, zanim przejdzie na licencję organizacji. Do tego czasu nie widzi żadnego zespołu poza własnym.",
    "The sign-in worked. A licence bought by this account, or a lead naming or inviting it by its email address, gives it a seat; another account can be used meanwhile.":
      "Logowanie się powiodło. Miejsce daje licencja kupiona na to konto albo wskazanie lub zaproszenie od lidera na adres e-mail tego konta; tymczasem można użyć innego konta.",
    /* The copywriter's last section of the same file (2026-11-22): the builder's placeholders worded, and the named person waiting. */
    "More than one person accepted this naming, so confirm only the colleague you named.":
      "Wskazanie zostało przyjęte przez więcej niż jedną osobę, więc należy potwierdzić tylko tę, którą wskazano.",
    "More than one person accepted this invitation, so confirm only the person you invited.":
      "Zaproszenie zostało przyjęte przez więcej niż jedną osobę, więc należy potwierdzić tylko tę, którą zaproszono.",
    "Every desk seat on this licence is taken, so a person's Join waits until one is free or a seat is added.":
      "Wszystkie miejsca dla stanowisk w tej licencji są zajęte, więc dołączenie czeka, aż któreś się zwolni albo dojdzie nowe miejsce.",
    "That person can no longer be named on this licence, so nobody was named.": "Tej osoby nie można już wskazać w tej licencji, więc nikt nie został wskazany.",
    "That is not an email address, so nobody was named.": "To nie jest adres e-mail, więc nikt nie został wskazany.",
    "Another lead on this licence has already invited this address, so this invitation was not made.":
      "Inny lider tej licencji już zaprosił ten adres, więc to zaproszenie nie zostało utworzone.",
    "waiting for the owner to confirm": "czeka na potwierdzenie przez osobę, do której należy licencja",
    "Accepted. {PROVIDER} does not vouch for this account's address, so {OWNER} confirms it next; this Studio then moves onto the paid lead seat by itself. Nothing is needed here meanwhile.":
      "Przyjęto. {PROVIDER} nie poświadcza adresu tego konta, więc teraz potwierdza to {OWNER}; potem to Studio samo przejdzie na płatne miejsce lidera. Tutaj nic nie trzeba robić.",
    "Accepted; {OWNER} confirms it next.": "Przyjęto; teraz potwierdza to {OWNER}.",
    "named: {N} of {OF}": "wskazani: {N} z {OF}",
    "Leads on this licence": "Liderzy w tej licencji",
    "A lead sees and manages their own team, and nobody else's. Removing a lead hands their team to the owner, and its desks keep their seats.": "Lider widzi i prowadzi tylko własny zespół. Po usunięciu z liderów zespół przechodzi do osoby, do której należy licencja, a jego stanowiska zachowują miejsca w licencji.",
    "signed in {DATE} · on their own trial": "logowanie {DATE} · własny okres próbny",
    "Signed in to Studio at the organisation, not yet named": "Osoby zalogowane w Studiu w tej organizacji, jeszcze niewskazane",
    "Naming takes a free lead seat. Until then each works on a trial of their own and sees nothing of this licence's teams.": "Wskazanie zajmuje wolne miejsce lidera. Do tego czasu każda z tych osób pracuje we własnym okresie próbnym i nie widzi zespołów tej licencji.",
    "Every lead seat is taken, so naming can wait until one is free.": "Wszystkie miejsca liderów są zajęte, więc wskazać można dopiero po zwolnieniu któregoś.",
    "Desk seats on this licence": "Miejsca dla stanowisk w tej licencji",
    "in use: {HELD} of {OF}": "zajęte: {HELD} z {OF}",
    "By team": "Według zespołów",
    "yours: {N}": "własny: {N}",
    "{NAME}: {N}": "{NAME}: {N}",
    "Named a lead by the licence's owner": "Miejsce lidera nadała osoba, do której należy licencja",
    "Only the owner names leads, and only the owner can take this seat back.": "Liderów wskazuje tylko osoba, do której należy licencja, i tylko ona może to miejsce odebrać.",
    "Your team": "Zespół",
    "The people added on the Team screen. This Studio sees and manages them, and no other team.": "Osoby dodane na ekranie Zespół. To Studio je widzi i nimi zarządza; innych zespołów nie widać.",
    "desks seated: {N}": "stanowiska z miejscem: {N}",
    "The licence": "Licencja",
    "One pool, shared by every lead on this licence.": "Jedna pula, wspólna dla wszystkich liderów tej licencji.",
    "desk seats in use: {HELD} of {OF}": "zajęte miejsca dla stanowisk: {HELD} z {OF}",
    "Your team on this licence": "Własny zespół w tej licencji",
    "Its owner can name this account a lead": "Osoba, do której należy licencja, może wskazać to konto jako lidera",
    "Your organisation no longer gives this account access to Etiuda.": "Organizacja nie przyznaje już temu kontu dostępu do Etiudy.",
    "This desk keeps its catalog and works with it as before, but new editions from the team no longer reach it. The organisation's IT department can give access again.": "To stanowisko zachowuje swój katalog i działa z nim jak dotąd, ale nowe wydania od zespołu już do niego nie trafiają. Dostęp może przywrócić dział IT organizacji.",
    "This account's sign-in needs renewing.": "Logowanie tego konta wymaga odnowienia.",
    "This desk keeps its catalog and works with it as before. Signing in again, under Account, brings the team's new editions back.": "To stanowisko zachowuje swój katalog i działa z nim jak dotąd. Po ponownym zalogowaniu się w części Konto nowe wydania od zespołu znów zaczną docierać.",
    "Only people a lead adds": "Tylko osoby dodane przez lidera",
    "A colleague who signs in on a desk waits for a lead to add them, by email address or from the Team screen's list.": "Osoba, która zaloguje się na stanowisku, czeka, aż lider doda ją po adresie e-mail lub z listy na ekranie Zespół.",
    "Anyone at the organisation who signs in": "Każda osoba z organizacji, która się zaloguje",
    "Each colleague's desk takes a seat by itself as they sign in, until the seats run out.": "Stanowisko każdej osoby z organizacji samo zajmuje miejsce przy logowaniu, dopóki miejsc wystarczy.",
    "Who may take a desk seat": "Kto może zająć miejsce dla stanowiska",
    "Changing this keeps everyone already seated.": "Zmiana tego ustawienia nie odbiera miejsca nikomu, kto już je ma.",
    "The licence has arrived. Lead seats: {LEAD}. Desk seats: {DESK}.": "Licencja dotarła. Miejsca liderów: {LEAD}. Miejsca dla stanowisk: {DESK}.",
    "The licence has arrived.": "Licencja dotarła.",
    "One thing to settle, once: desk seats are taken as people sign in, so it matters who may take them. It can be changed here at any time.": "Jedna rzecz do ustalenia, jeden raz: miejsca dla stanowisk zajmuje się przy logowaniu, więc ważne jest, kto może je zająć. Można to zmienić tutaj w każdej chwili.",
    "Keep this choice": "Zachowaj ten wybór",
    "not added yet": "jeszcze nie dodano",
    "Every lead seat on the licence is taken, so nobody was named. Removing a lead, or buying another lead seat, frees one.": "Wszystkie miejsca liderów w licencji są zajęte, więc nikogo nie wskazano. Miejsce zwolni usunięcie któregoś lidera albo dokupienie miejsca lidera.",
    "Only the licence's owner can change who may take a desk seat, so nothing was changed.": "Tylko osoba, do której należy licencja, może zmienić, kto zajmuje miejsca dla stanowisk, więc nic nie zmieniono.",
    /* Account's Carry on from another computer (board 980, A6): the copywriter's words of 2026-11-12, after the words Studio already
       uses for the key ("Klucz podpisu", "kopia zapasowa", "hasło kopii"). The count stands after a colon, so no plural forms. */
    "Carry on from another computer": "Praca z innego komputera",
    "The signing key": "Klucz podpisu",
    "Bring its backup copy from the other computer; its passphrase opens it here.":
      "Wystarczy przenieść jego kopię zapasową z tamtego komputera; tutaj otworzy ją hasło kopii.",
    "Choose the backup copy…": "Wybierz kopię zapasową…",
    "Restored here, with the relay teams its copy carried: {N}.": "Przywrócony tutaj, razem z zespołami na przekaźniku zapisanymi w kopii: {N}.",
    "Restored here. Its copy carried no relay team.": "Przywrócony tutaj. Kopia nie zawierała żadnego zespołu na przekaźniku.",
    "Projects on a share": "Projekty w udziale sieciowym",
    "Open the folder on the share that holds them. Each team kept there comes back as its project opens.":
      "Wystarczy otworzyć folder w udziale, w którym leżą. Każdy zapisany tam zespół wraca wraz z otwarciem swojego projektu.",
    "Open the folder…": "Otwórz folder…",
    "That seat is no longer on this licence, or this Studio does not own the licence, so nothing was changed.":
      "To miejsce nie należy już do tej licencji albo to Studio nie jest właścicielem licencji, więc nic nie zmieniono.",
    "The licence's owner always keeps a lead seat, even when every seat bought is taken, so this list can show one more than were bought.":
      "Osoba, do której należy licencja, zawsze zachowuje miejsce lidera, nawet gdy wszystkie kupione miejsca są zajęte, więc ta lista może pokazywać o jedno więcej, niż kupiono.",
    "The licence service could not confirm this request against this Studio's key, so nothing was changed. Try again; if it happens again, write to us through etiuda.dev.":
      "Usługa licencji nie potwierdziła tej prośby kluczem tego Studia, więc nic nie zmieniono. Można spróbować ponownie, a jeśli to się powtórzy, prosimy o wiadomość przez etiuda.dev.",
    "The licence service had already received this same request, most likely from this computer's own retry, so it did not take it twice. Try again.":
      "Usługa licencji otrzymała już tę samą prośbę, najpewniej przy ponownej próbie tego komputera, więc nie przyjęła jej drugi raz. Można spróbować jeszcze raz.",
    "The licence service could not read this request, so nothing was changed. A newer version of Studio may be needed: look on etiuda.dev, or write to us there.":
      "Usługa licencji nie mogła odczytać tej prośby, więc nic nie zmieniono. Być może potrzebna jest nowsza wersja Studia: warto zajrzeć na etiuda.dev albo napisać do nas przez tę stronę.",
    "The relay did not take the latest sync: this team's space there is full, at most 4096 files. Nothing on this computer is lost, and the team keeps the catalog it has. Write to us through etiuda.dev.":
      "Przekaźnik nie przyjął ostatniej synchronizacji: miejsce tego zespołu jest pełne, mieści najwyżej 4096 plików. Na tym komputerze nic nie przepadło, a zespół pracuje dalej z katalogiem, który ma. Prosimy o wiadomość przez etiuda.dev.",
    "The relay did not take this computer's latest upload, because it arrived out of step with the team. Nothing on this computer is lost, and Studio sends it again at its next look; nothing needs doing.":
      "Przekaźnik nie przyjął ostatniej wysyłki z tego komputera, bo nie zgadzała się z bieżącym stanem zespołu. Na tym komputerze nic nie przepadło, a Studio wyśle ją ponownie przy następnym sprawdzeniu; nic nie trzeba robić.",
    "The relay has refused this computer's uploads three times in a row as out of step with the team. Nothing on this computer is lost, but the relay's copy does not yet have this computer's latest. A newer version of Studio may set this right: look on etiuda.dev, and if it continues after that, write to us there.":
      "Przekaźnik już trzy razy z rzędu odrzucił wysyłki z tego komputera, bo nie zgadzały się z bieżącym stanem zespołu. Na tym komputerze nic nie przepadło, ale kopia na przekaźniku nie ma jeszcze najnowszych zmian z tego komputera. Pomóc może nowsza wersja Studia: warto zajrzeć na etiuda.dev, a jeśli i z nią to się powtarza, prosimy o wiadomość przez tę stronę.",
    "This computer cannot open the team's newest file yet, and is fetching what it needs. Until then it cannot publish or change the team's members; nothing is lost.":
      "Ten komputer nie może jeszcze otworzyć najnowszego pliku zespołu i pobiera to, czego potrzebuje. Do tego czasu nie może publikować ani zmieniać członków zespołu; nic nie przepada.",
    "Removal waiting":
      "Usunięcie czeka",
    "Removal waiting: {NAME}. It happens as soon as this computer is in step with the team: connected, and holding the latest member list. Until then, they can still read the team's catalog.":
      "Usunięcie czeka: {NAME}. Nastąpi, gdy ten komputer będzie zgodny z zespołem, czyli połączony i z najnowszą listą członków. Do tego czasu ta osoba nadal może czytać katalog zespołu.",
    "The member list was changed on another computer this team is led from, and Studio is bringing that change here. The removal waiting here is applied on top of it once it has arrived.":
      "Listę członków zmieniono na innym komputerze, z którego prowadzony jest ten zespół, a Studio właśnie przenosi tu tę zmianę. Oczekujące tu usunięcie zostanie zastosowane po jej nadejściu.",
    "The member list that stands lacks people added on one of the computers this team is led from; they wait to be admitted again: {NAMES}.":
      "Na obowiązującej liście członków brakuje osób dodanych na jednym z komputerów, z których prowadzony jest ten zespół; czekają na ponowne przyjęcie: {NAMES}.",
    "This computer cannot open the team's newest file until Studio's signing key is restored here from its backup copy: in the Menu, under Settings, then Signing key, “Restore it from a backup copy…”. Until then it cannot publish or change the team's members; nothing is lost.":
      "Ten komputer nie może otworzyć najnowszego pliku zespołu, dopóki klucz podpisu Studia nie zostanie tu przywrócony z kopii zapasowej: w menu, w Ustawieniach, w części Klucz podpisu, polecenie „Przywróć go z kopii zapasowej…”. Do tego czasu nie może publikować ani zmieniać członków zespołu; nic nie przepada.",
    "The relay is taking fewer uploads for a moment, as there were many in a short time. Nothing is lost, and Studio sends again shortly by itself; nothing needs doing.":
      "Przekaźnik chwilowo przyjmuje mniej wysyłek, bo w krótkim czasie było ich wiele. Nic nie przepadło, a Studio wkrótce samo wyśle je ponownie; nic nie trzeba robić.",
    "This team is on Etiuda's test service, made there by the Test Service build; this build does not reach it, so it will not answer here.":
      "Ten zespół działa w testowej usłudze Etiudy, gdzie utworzyła go wersja Test Service; obecna wersja do niej nie sięga, więc zespół tu nie odpowie.",
    "Its data is kept, and nothing is sent.":
      "Jego dane zostają, a nic nie jest wysyłane.",
    "The relay did not take the latest sync and gave no reason Studio recognises. Nothing on this computer is lost, and Studio tries again at its next look; nothing needs doing now. If it lasts, write to us through etiuda.dev with the relay's answer: {STATUS} {ERROR}.":
      "Przekaźnik nie przyjął ostatniej synchronizacji i nie podał powodu, który Studio rozpoznaje. Na tym komputerze nic nie przepadło, a Studio spróbuje ponownie przy następnym sprawdzeniu; teraz nic nie trzeba robić. Jeśli to się utrzymuje, prosimy o wiadomość przez etiuda.dev z odpowiedzią przekaźnika: {STATUS} {ERROR}.",
    "The relay did not take the latest sync and gave no reason. Nothing on this computer is lost, and Studio tries again at its next look; nothing needs doing now. If it lasts, write to us through etiuda.dev with the relay's answer: {STATUS}.":
      "Przekaźnik nie przyjął ostatniej synchronizacji i nie podał powodu. Na tym komputerze nic nie przepadło, a Studio spróbuje ponownie przy następnym sprawdzeniu; teraz nic nie trzeba robić. Jeśli to się utrzymuje, prosimy o wiadomość przez etiuda.dev z odpowiedzią przekaźnika: {STATUS}.",
    "This team was not made: this Studio's signing key already holds 25 teams on the relay, the most it may. A place frees when the relay deletes a team's copy after its licence ends, or write to us through etiuda.dev. Nothing on the team's computers or in Studio was changed.":
      "Nie utworzono zespołu: klucz podpisu tego Studia ma już na przekaźniku 25 zespołów, czyli najwięcej, ile może. Miejsce zwalnia się, gdy przekaźnik usunie kopię zespołu po wygaśnięciu jego licencji; można też napisać do nas przez etiuda.dev. Nic na komputerach zespołu ani w Studiu się nie zmieniło.",
    "This Studio's signing key does not open on this computer, so nothing was sent. Restore it first from the Menu, under Settings, then Signing key.":
      "Klucz podpisu tego Studia nie otwiera się na tym komputerze, więc nic nie wysłano. Najpierw trzeba go przywrócić z menu, w Ustawieniach, w części Klucz podpisu.",
    /* Clear local memory and Remove signing key (board 960). */
    "Clear local memory…": "Wyczyść pamięć lokalną…",
    "Clear local memory?": "Wyczyścić pamięć lokalną?",
    "Goes from this computer: Studio's other settings, the Opened recently list and the open catalog tabs.":
      "Znikną z tego komputera: pozostałe ustawienia Studia, lista Ostatnio otwierane i zakładki otwartych katalogów.",
    "Stays: every catalog and its folder, the licence, the teams and the relay, the signing key and its backup copies, and the AI service with its key, which Forget the key removes, from the Menu, under Settings, then AI service.":
      "Zostają: wszystkie katalogi z ich folderami, licencja, zespoły i przekaźnik, klucz podpisu i jego kopie zapasowe oraz usługa AI z kluczem, który usuwa przycisk Usuń klucz z menu, w Ustawieniach, w części Usługa AI.",
    "Clear": "Wyczyść",
    "Local memory cleared": "Wyczyszczono pamięć lokalną",
    "Remove the signing key…": "Usuń klucz podpisu…",
    "Remove the signing key?": "Usunąć klucz podpisu?",
    "The key goes to the Recycle Bin, and Undo does not bring it back. Without it, this Studio can no longer publish for its team or sign as its lead. A licence held here is tied to this key; with a new key, signing in again moves it there. A backup copy of the key has been made: restoring it from the Menu, under Settings, then Signing key, brings all of that back.":
      "Klucz trafi do Kosza, a Cofnij go nie przywróci. Bez niego to Studio nie opublikuje już niczego dla swojego zespołu i przestanie go prowadzić. Licencja w tym Studiu jest związana z tym kluczem; przy nowym kluczu ponowne zalogowanie się przeniesie ją na niego. Kopia zapasowa klucza została już utworzona: wystarczy ją przywrócić z menu, w Ustawieniach, w części Klucz podpisu, aby wszystko wróciło.",
    "The key goes to the Recycle Bin, and Undo does not bring it back. Without it, this Studio can no longer publish for its team or sign as its lead, and a team on the relay cannot be handed to a new key. A licence held here is tied to this key; with a new key, signing in again moves it there. Studio knows of no backup copy, so once the Recycle Bin is emptied the key is gone for good. Making one first, from the Menu, under Settings, then Signing key, keeps the way back open.":
      "Klucz trafi do Kosza, a Cofnij go nie przywróci. Bez niego to Studio nie opublikuje już niczego dla swojego zespołu i przestanie go prowadzić, a zespołu na przekaźniku nie da się przekazać nowemu kluczowi. Licencja w tym Studiu jest związana z tym kluczem; przy nowym kluczu ponowne zalogowanie się przeniesie ją na niego. Studio nie zna żadnej kopii zapasowej, więc po opróżnieniu Kosza klucz przepadnie bezpowrotnie. Utworzenie kopii z menu, w Ustawieniach, w części Klucz podpisu, zostawia drogę powrotu.",
    "The key goes to the Recycle Bin, and Undo does not bring it back. A licence held here is tied to this key; with a new key, signing in again moves it there. A backup copy of the key has been made: restoring it from the Menu, under Settings, then Signing key, brings it back.":
      "Klucz trafi do Kosza, a Cofnij go nie przywróci. Licencja w tym Studiu jest związana z tym kluczem; przy nowym kluczu ponowne zalogowanie się przeniesie ją na niego. Kopia zapasowa klucza została już utworzona: wystarczy ją przywrócić z menu, w Ustawieniach, w części Klucz podpisu.",
    "The key goes to the Recycle Bin, and Undo does not bring it back. A licence held here is tied to this key; with a new key, signing in again moves it there. Studio knows of no backup copy, so once the Recycle Bin is emptied the key is gone for good. Making one first, from the Menu, under Settings, then Signing key, keeps the way back open.":
      "Klucz trafi do Kosza, a Cofnij go nie przywróci. Licencja w tym Studiu jest związana z tym kluczem; przy nowym kluczu ponowne zalogowanie się przeniesie ją na niego. Studio nie zna żadnej kopii zapasowej, więc po opróżnieniu Kosza klucz przepadnie bezpowrotnie. Utworzenie kopii z menu, w Ustawieniach, w części Klucz podpisu, zostawia drogę powrotu.",
    "Remove the signing key": "Usuń klucz podpisu",
    "The signing key can be removed once the move or handover already under way ends. Nothing was changed.":
      "Klucz podpisu będzie można usunąć, gdy zakończy się trwające już przenoszenie lub przekazanie. Nic nie zmieniono.",
    "Studio's settings file could not be written, so nothing was restored.":
      "Nie udało się zapisać pliku ustawień Studia, więc niczego nie przywrócono.",
    "Studio's settings file could not be written, so nothing was cleared.":
      "Nie udało się zapisać pliku ustawień Studia, więc nic nie wyczyszczono.",
    "Studio's settings file could not be written, so nothing was reset.":
      "Nie udało się zapisać pliku ustawień Studia, więc nic nie zresetowano.",
    "The reset was pointed at a folder outside Studio's own data, so nothing was reset.":
      "Reset wskazywał folder spoza własnych danych Studia, więc nic nie zresetowano.",
    "Studio's settings file could not be written, so this change was not saved.":
      "Pliku ustawień Studia nie udało się zapisać, więc ta zmiana nie została zachowana.",
    "The signing key could not be moved to the Recycle Bin, so it stays where it is.":
      "Nie udało się przenieść klucza podpisu do Kosza, więc został na miejscu.",
    "This Studio already has 30 teammates, open invitations included, so a new one can join only once a place frees.": "To Studio ma już 30 członków zespołu, wliczając otwarte zaproszenia, więc nowy może dołączyć dopiero, gdy zwolni się miejsce.",
    "A teammate is waiting to join, but this Studio already has 30, open invitations included. Its request waits until a place frees.": "Ktoś czeka na dołączenie do zespołu, ale to Studio ma już 30 członków, wliczając otwarte zaproszenia. Prośba poczeka, aż zwolni się miejsce.",
    "This Studio already leads three teams, the most it can, so a new one cannot be made.": "To Studio prowadzi już trzy zespoły, czyli najwięcej, ile może, więc nowego nie można utworzyć.",
    "The teams file cannot be read, so no invitation was made.": "Nie udało się odczytać pliku zespołów, więc zaproszenia nie utworzono.",
    "A name and a role. It is kept in the team file and shown to every teammate.": "Imię i nazwisko oraz stanowisko służbowe. Zostaje zapisane w pliku zespołu i jest widoczne dla każdego członka zespołu.",
    "Connections": "Połączenia",
    "nothing connected": "nic nie jest połączone",
    "The relay": "Przekaźnik",
    "teammates join by invitation": "członkowie dołączają przez zaproszenie",
    "This Studio": "To Studio",
    "no team yet": "jeszcze bez zespołu",
    "No teammate is connected yet.": "Nie ma jeszcze żadnych członków zespołu.",
    "A team carries catalogs to every teammate.": "Przez zespół katalogi trafiają do wszystkich jego członków.",
    "has an older one": "ma starsze wydanie",
    "and 1 more teammate": "i jeszcze 1 członek zespołu",
    "and {N} more teammates": "i kolejni członkowie: {N}",
    "{N} teammate": "członkowie:\u00a0{N}",
    "{N} teammates": "członkowie:\u00a0{N}",
    "1 team · 1 teammate": "1 zespół · 1 członek",
    "1 team · {N} teammates": "1 zespół · członkowie: {N}",
    "{T} teams · {N} teammates": "zespoły: {T} · członkowie: {N}",
    "Team": "Zespół",
    "folder away": "folder niedostępny",
    "the relay": "przekaźnik",
    "the relay, licence ended": "przekaźnik, licencja wygasła",
    "the relay, read-only": "przekaźnik, tylko do odczytu",
    "the relay, stopped": "przekaźnik wstrzymany",
    "the relay's copy deleted": "kopia na przekaźniku usunięta",
    "leads the team": "prowadzi zespół",
    "on the relay": "na przekaźniku",
    "catalogs": "katalogi",
    "cards in all": "karty łącznie",
    "editions kept": "zachowane wydania",
    "teammates connected": "połączeni członkowie",
    "All catalogs in the Library: {N}": "Wszystkie katalogi w Bibliotece: {N}",
    "Every catalog this Studio holds.": "Wszystkie katalogi tego Studia.",
    "With changes to publish": "Ze zmianami do publikacji",
    "More for {NAME}": "Więcej dla katalogu {NAME}",
    "Draft": "Szkic",
    "as published": "bez zmian",
    "edits not published: {N}": "nieopublikowane edycje: {N}",
    "all clear": "wszystko w porządku",
    "to look at: {N}": "do sprawdzenia: {N}",
    "Reaches": "Trafia do",
    "nobody yet": "jeszcze do nikogo",
    "Last edited": "Ostatnia zmiana",
    "Teams": "Zespoły",
    "Every team this Studio leads, and every teammate connected.": "Wszystkie zespoły prowadzone z tego Studia i wszyscy połączeni członkowie.",
    "This Studio leads no team yet.": "To Studio nie prowadzi jeszcze żadnego zespołu.",
    "Relay: {DOMAIN} (team {ID})": "Przekaźnik: {DOMAIN} (zespół {ID})",
    "Signing key's print: {PRINT}": "Odcisk klucza podpisu: {PRINT}",
    "Goes to {TEAM}": "Trafia do zespołu {TEAM}",
    "Make another team…": "Utwórz kolejny zespół…",
    "What the team receives": "Co otrzymuje zespół",
    "Not from this Studio": "Spoza tego Studia",
    "older edition": "starsze wydanie",
    "Teammates": "Członkowie zespołu",
    "Teammate": "Członek zespołu",
    "Kind": "Rodzaj",
    "Catalog in use": "Używany katalog",
    "Last heard": "Ostatni kontakt",
    "No teammates connected yet.": "Nie ma jeszcze połączonych członków zespołu.",
    "Admitted": "W zespole",
    "This is not an invitation Studio can read, so it did not ask to join.":
      "To nie jest zaproszenie, które Studio potrafi odczytać, więc nie wysłano prośby o dołączenie.",
    "This computer cannot keep a key sealed for this account, so Studio did not ask to join.":
      "Ten komputer nie może przechowywać klucza zapieczętowanego dla tego konta, więc nie wysłano prośby o dołączenie.",
    "This Studio leads that team, so it cannot join it as a teammate.":
      "To Studio prowadzi ten zespół, więc nie może dołączyć do niego jako członek.",
    "This Studio is already a teammate on another team, and it can be on one only, so it did not ask to join. Leave that team first.":
      "To Studio jest już członkiem innego zespołu, a może być członkiem tylko jednego, więc nie wysłano prośby o dołączenie. Najpierw trzeba opuścić tamten zespół.",
    "This Studio's member key is the same as its signing key, so it did not ask to join.":
      "Klucz członka zespołu jest w tym Studiu taki sam jak klucz podpisu, więc nie wysłano prośby o dołączenie.",
    "This Studio is not a teammate on any team.":
      "To Studio nie jest członkiem żadnego zespołu.",
    "A teammate writes only its request to join and the catalog it has in use, so nothing else was written.":
      "Członek zespołu zapisuje tylko swoją prośbę o dołączenie i katalog, którego używa, więc nic więcej nie zostało zapisane.",
    "the team that holds the original is out of reach from here, so nothing was brought":
      "zespół, w którym jest oryginał, jest stąd nieosiągalny, więc nic nie zostało pobrane",
    "the team this Studio is on holds no edition of that catalog this Studio can open, so no copy was made":
      "w zespole, którego członkiem jest to Studio, nie ma wydania tego katalogu, które to Studio może otworzyć, więc nie utworzono kopii",
    "Join a team as a teammate": "Dołącz do zespołu jako członek",
    "The invitation from the team's lead": "Zaproszenie od lidera zespołu",
    "Ask to join": "Poproś o dołączenie",
    "The team this Studio is on": "Zespół, którego członkiem jest to Studio",
    "Led by {NAME}": "Prowadzi: {NAME}",
    "Waiting for the team's lead to let this Studio in": "Oczekiwanie na przyjęcie przez lidera zespołu",
    "This Studio waits for the team's lead to renew the relay licence.":
      "To Studio czeka, aż lider zespołu odnowi licencję przekaźnika.",
    "The team's relay licence has ended. Only the team's lead can renew it.":
      "Licencja przekaźnika dla tego zespołu wygasła. Odnowić ją może tylko lider zespołu.",
    "The team's relay licence has ended, and the relay stays read-only until the team's lead renews it.":
      "Licencja przekaźnika dla tego zespołu wygasła, a przekaźnik działa tylko do odczytu, dopóki lider zespołu jej nie odnowi.",
    "The relay no longer holds the team's copy. Only the team's lead can renew the licence.":
      "Przekaźnik nie przechowuje już kopii zespołu. Licencję może odnowić tylko lider zespołu.",
    "The relay accepts nothing from the team until its lead renews the licence, so no new edition reaches this Studio.":
      "Dopóki lider zespołu nie odnowi licencji, przekaźnik nie przyjmuje niczego od zespołu, więc do tego Studia nie dociera żadne nowe wydanie.",
    "On this network the team's updates arrive about once a minute, not live.":
      "W tej sieci aktualizacje zespołu docierają mniej więcej co minutę, a nie na bieżąco.",
    "This network does not let the live connection to the relay through, so Studio asks the relay about once a minute instead. Nothing is lost, and nothing needs doing.":
      "Ta sieć nie przepuszcza połączenia na żywo z przekaźnikiem, więc Studio pyta przekaźnik mniej więcej co minutę. Nic nie ginie i nic nie trzeba robić.",
    "The licence ended on {DATE}.": "Licencja wygasła dnia {DATE}.",
    "The team works as before until {DATE}.": "Do dnia {DATE} zespół działa jak dotąd.",
    "The relay keeps the team's copy until {DATE}.": "Przekaźnik przechowuje kopię zespołu do dnia {DATE}.",
    "Out of reach from here": "Poza zasięgiem",
    "This Studio is no longer on the team.": "To Studio nie jest już członkiem zespołu.",
    "The team's lead turned down this Studio's request to join.": "Prośba tego Studia o dołączenie została odrzucona przez lidera zespołu.",
    "{TEAM} works through a shared folder, which Etiuda Studio no longer follows: what this Studio has of it stays as it is, and a new invitation from the team's lead brings the team back.":
      "{TEAM} korzysta ze wspólnego folderu, którego Etiuda Studio już nie obsługuje: to, co to Studio ma z tego zespołu, zostaje bez zmian, a nowe zaproszenie od lidera zespołu przywróci zespół.",
    "{TEAM} now works through a shared folder, which Etiuda Studio does not follow: this Studio keeps what it has, and nothing new arrives until a new invitation from the team's lead.":
      "{TEAM} korzysta teraz ze wspólnego folderu, którego Etiuda Studio nie obsługuje: to Studio zachowuje to, co ma, i nic nowego nie dotrze do czasu nowego zaproszenia od lidera zespołu.",
    "The team file of {TEAM} names a relay this Etiuda Studio does not use, so this Studio does not follow it: it keeps the team, its catalogs and its connection as they were, and sends nothing there. If the team moves back, nothing is needed; otherwise a new invitation from the team's lead is.":
      "{TEAM} wskazuje w swoim pliku przekaźnik, z którego to Etiuda Studio nie korzysta, więc to Studio za nim nie podąża: zachowuje zespół, katalogi i połączenie bez zmian i niczego tam nie wysyła. Jeśli zespół wróci na poprzedni przekaźnik, nic nie trzeba robić; w przeciwnym razie potrzebne jest nowe zaproszenie od lidera zespołu.",
    "{LEAD}'s team": "Zespół osoby {LEAD}",
    "Catalogs made from the team's editions stay as they are.": "Katalogi utworzone z wydań zespołu zostają bez zmian.",
    "{TITLE}, rev {R}": "{TITLE}, wer.\u00a0{R}",
    "Leave the team": "Opuść zespół",
    "This Studio left the team, and its copy of the team's files went to the Recycle Bin.":
      "To Studio opuściło zespół, a kopia plików zespołu trafiła do Kosza.",
    "This Studio left the team, but its copy of the team's files could not be moved to the Recycle Bin, so it stays in Studio's own folder on this computer.":
      "To Studio opuściło zespół, ale kopii plików zespołu nie udało się przenieść do Kosza, więc zostaje w folderze Studia na tym komputerze.",
    /* Seat reduction and the person waiting on a full licence, Team screen (pieces c and d): the copywriter's words, section 7. */
    "From {DATE}, seats on this licence: {COUNT}. Seated now: {SEATED}.":
      "Od {DATE} miejsca w tej licencji: {COUNT}. Zajęte teraz: {SEATED}.",
    "From {DATE}, the seats of those not chosen are not renewed: each of their desks and Studios works until its last confirmation runs out, then stops.":
      "Od {DATE} miejsca osób niewybranych nie są odnawiane: każde ich stanowisko i Studio działa do wygaśnięcia ostatniego potwierdzenia, a potem się zatrzymuje.",
    "stays": "zostaje",
    "Keeps a seat": "Zachowuje miejsce",
    "Save who stays": "Zapisz, kto zostaje",
    "Who stays is saved.": "Zapisano, kto zostaje.",
    "More people are chosen than the licence will have seats for, so nothing was changed.":
      "Wybrano więcej osób, niż licencja będzie mieć miejsc, więc nic nie zostało zmienione.",
    "One of the people chosen no longer holds a seat on this licence, so nothing was changed.":
      "Jedna z wybranych osób nie ma już miejsca w tej licencji, więc nic nie zostało zmienione.",
    "waiting for a free seat": "czeka na wolne miejsce",
  };

  /* THE FEW FORM, for 2 to 4 and not 12 to 14, keyed by the English plural it belongs to. A noun
     whose few and many forms are the same word still has a row here, so that every counted noun
     is read the same way. */
  const PL_FEW = {
    "{N} days ago": "{N} dni temu",
    "{N} weeks ago": "{N} tygodnie temu",
    "{N} months ago": "{N} miesiące temu",
    "{N} years ago": "{N} lata temu",
    "{N} revs": "{N} wersje",
    "{N} files": "{N} pliki",
    "{N} cards": "{N} karty",
    "{N} parts": "{N} części",
    "{N} places": "{N} miejsca",
    "{N} cards ticked": "{N} zaznaczone karty",
    "{N} errors": "{N} błędy",
    "{N} warnings": "{N} ostrzeżenia",
    "{N} suggestions": "{N} podpowiedzi",
    /* Claudette's second pass. Kategorii and intencji are the same word in the genitive plural
       as in the singular genitive, which is correct and looks like a mistake; the few forms are
       kategorie and intencje, so both are written down and nothing is tidied away later. */
    "{N} rows": "{N} wiersze",
    "{N} columns": "{N} kolumny",
    "{N} uses": "{N} użycia",
    "{N} categories": "{N} kategorie",
    "{N} intents": "{N} intencje",
    "{N} changes": "{N} zmiany",
    "{N} problems": "{N} problemy",
    "{N} unexpected differences": "{N} nieoczekiwane różnice",
    "{N} pairs": "{N} pary",
    "{N} cells": "{N} komórki",
    "{N} times": "{N} razy",
    "{N} more cards": "{N} kolejne karty",
    /* The text import's own two (602). */
    "{N} asks": "{N} zapytania",
    "{N} characters": "{N} znaki",
    /* The project's settings (579). Wydanie is neuter, so the few form is zachowane wydania. */
    "{N} editions kept": "{N} zachowane wydania",
    /* The review's four that had none (polish 03, item 7). */
    "{N} new cards": "{N} nowe karty",
    "{N} labels": "{N} etykiety",
    "{N} removals": "{N} usunięcia",
    "{N} catalog fields": "{N} pola katalogu",
    /* The import notes' two that had none (boards 784 and 785). */
    "{N} fields": "{N} pola",
    "{N} names": "{N} nazwy",
    /* The month, in sentences (board 862), Claudette's few form of M13; M5's is a frame of its own (" ##few"). */
    "{N} more paths on the map": "{N} kolejne ścieżki na mapie",
    /* By kind (board 862). */
    "{N} findings": "{N} uwagi",
    "{N} kinds": "{N} rodzajach",
    /* Since the last edition (board 862). */
    "{N} words": "{N} słowa",
    /* the press (decisions 2026-10-07 00:49) */
    "{N} cards changed": "{N} karty zmienione",
    "{N} cards retired": "{N} karty wycofane",
    "{N} cards as in rev {REV}": "{N} karty jak w wer. {REV}",
    "{N} cards go out in rev {REV}": "{N} karty wychodzą w wer. {REV}",
    "{N} cards, every one new": "{N} karty, wszystkie nowe",
    "{N} teammates admitted read this folder.": "Przyjęci członkowie zespołu czytający ten folder:\u00a0{N}.",
    "{N} teammates": "członkowie:\u00a0{N}",
    "{N} more are named and not admitted yet.": "{N} kolejne są nazwane, ale jeszcze nieprzyjęte.",
  };

  /* WHAT STILL HAS NO POLISH, AND WHICH SCREEN EACH ONE THEREFORE KEEPS IN ENGLISH.
   *
   * POLISH TURNS ON A SCREEN AT A TIME. Maxim ruled it on 2026-09-18 (board 468): the rule that
   * half a screen in each language is worse than either is a rule about A SCREEN, so a word the
   * wizard has no Polish for keeps the wizard English and says nothing about the lint list. It
   * was one list for the whole interface until that day, and the cost of that was the whole
   * interface waiting on the slowest screen.
   *
   * A STRING IS LISTED UNDER EVERY SCREEN THAT PAINTS IT, repeated rather than shared, because
   * what this table answers is one question per screen: is there anything on THIS screen with no
   * Polish. "What changes" is the archive's heading, the review queue's column and the upgrade
   * cover's, so it stands in the way of all three and is written three times.
   *
   * EVERY SCREEN HAS A KEY HERE EVEN WHERE ITS LIST IS EMPTY, and a name that is not a key is
   * treated as NOT ready: a screen that turned Polish because its name was misspelt is the one
   * failure this mechanism cannot see from the inside. `tests/polish.mjs` holds every name
   * ui/app.js declares against these keys.
   */
  const NO_TWIN = {
    /* The band, the tabs, the chrome row, the rail and the wizard's foot. THE RAIL NAMES EVERY
       SECTION, so a section whose own name has no twin would keep the chrome English and every
       screen's frame with it; Statistics was that name until 2026-09-18 and is a pair now, so
       the rule stands and nothing is standing on it. */
    chrome: [],

    /* The project list. */
    projects: [],
    teams: [],

    /* Following another Studio's team (board 962 stage 7, V4): the join cover and the leave. */
    followJoin: [],
    followLeave: [],

    /* The Paths map (board 814, S3c). */
    paths: [],

    /* The cards table and the card's fields. */
    cards: [],

    /* The intents and the categories, and the reorder arrows' tooltips (board 479). The engine
       reorders by dragging and names no such act in its table - "Drag to reorder" is the
       nearest and it is a different instruction - so both tooltips are Claudette's. */
    tags: [],

    /* The lint list, the quick facts, the import affordance and the sections that only say they
       are coming: every word on them is a pair. */
    lint: [],
    facts: [],
    import: [],

    /* The archive: the timeline is pairs, and the diff borrows the review queue's three columns
       (board 479), which are pairs since Claudette's second pass. */
    archive: [],

    /* The Statistics section. Its tables are the ones `node tools/stats-read.mjs` prints, the
       cells as printed and the heads said in Polish; its own words are its name in the rail, its
       views and the desks with nothing new. */
    stats: [],

    /* The review queue's screen, every word of it Claudette's second pass. */
    queue: [],

    /* The import wizard: its rail, its steps, its foot and its three covers. */
    wizard: [],

    /* The publish cover. Its last words - the awaiting sentence in both shapes, and the span's
       two labels, which went to the Statistics section with the row that holds them (board 560)
       - were the copywriter's to write rather than the engine's to lend, since the engine names
       no period anywhere and prints what a draft awaits on the command line. They landed in her
       third pass (board 538) and this list is empty. */
    publish: [],

    /* The New project cover, the new intent and category cover, and the new card cover: pairs
       throughout. */
    new: [],
    tag: [],
    card: [],

    /* The upgrade cover, which borrows three of the wizard's and the queue's words. */
    upgrade: [],

    /* The Settings cover (board 465). The engine paints no AI anything, so there was nothing to
       borrow; the copywriter wrote the name of the slot in her third pass (board 538) and nothing
       about what it will hold, because nothing is known. This list is empty. */
    settings: [],
    maintenance: [],

    /* The About behind the Menu's third row, and the agreement it opens (2026-10-06): Claudette's
       pairs throughout, so this list is empty like the rest. The Menu's list and the status bar are
       the chrome's. */
    about: [],

    /* The audit pack's screen (board 606). Its own words are Claudius's draft and the two
       long statements on it are the ones src/review.mjs and src/audit.mjs already write;
       the table above holds every one of them, so this list is empty like the rest. */
    audit: [],

    /* The project's own settings and the languages it declares (board 579). Its words are the
       engineer seat's, written with the screen rather than after it, so this list is empty like
       the rest and the screen speaks Polish from its first day. */
    langs: [],

    /* THE TOUR (board 720) IS A SCREEN OF ITS OWN RATHER THAN A PART OF THE CHROME, so a step
       with no twin keeps the tour English and nothing else, where a word of the chrome would
       keep the band, the rail and every screen's frame English with it. Its Polish is the
       copywriter's (board 744) and this list is empty like the rest. */
    tour: [],

    /* The Desks screen and the switches' cover (board 834, the sealed team), and the signing key's two covers, its backup
       copy and its restore (K6, K7). */
    desks: [],
    team: [],
    key: [],

    /* The licence cover (board 936, S6): the engineer's draft in both languages, for the copywriter. */
    licence: [],

    /* Studio's sign-in door (board 980): the product designer's words, placeholders for the copywriter. */
    door: [],

    /* The Variables page (board 845): Claudette's words throughout. */
    variables: [],

    /* Since the last edition (board 862): Claudette's words, and four of this seat's named at their pairs. */
    changes: [],

    /* A company proxy's question (ui/proxy-ask.js): the desk's words, placeholders for the copywriter. */
    proxy: [],
  };

  const TWIN = (en) => Object.prototype.hasOwnProperty.call(PL, en);
  /* The word after " ##" tells two Polish sentences of one English one apart, and is never shown. */
  const CTX = / ##[a-z]+$/;

  /* ---- the door the screens use ------------------------------------------------------------ */

  /* A NUMBER NEVER STANDS APART FROM THE WORD BESIDE IT, in any language: a number, or a count
     C() made, takes a no-break space from the word or colon before it, and a number gives one to
     the word after it, so "3 cards", "Cards: 3" and "rev 3" never break; a number followed by a
     parenthesis (revSaid) binds to the word before it as a number does. A word or a date leaves
     the frame's spaces as written (tests/few-forms.mjs 2c, 2d). */
  function fill(s, vars) {
    const has = (k) => vars && Object.prototype.hasOwnProperty.call(vars, k);
    const num = (k, counted) => has(k) && (counted ? /^\d+(\u00a0| ?\(|$)/ : /^\d+$/).test(String(vars[k]));
    return String(s)
      .replace(/([\p{L}:}]) (?=\{(\w+)\})/gu, (m, w, k) => num(k, true) ? w + NB : m)
      .replace(/\{(\w+)\} (?=[\p{L}{])/gu, (m, k) => num(k, false) ? "{" + k + "}" + NB : m)
      .replace(/\{(\w+)\}/g, (m, k) => has(k) ? String(vars[k]) : m);
  }

  const SCREENS = Object.keys(NO_TWIN);
  const readyOn = (name) => Object.prototype.hasOwnProperty.call(NO_TWIN, name)
    && NO_TWIN[name].length === 0;

  let lang = "en";
  let forced = false;

  /* WHICH SCREEN IS BEING PAINTED, and it is a single value rather than a stack because every
     painter in ui/app.js declares its own before it writes anything. The default is the chrome:
     the band, the rail and the acts, which is what a T() call outside any painter belongs to.
     A NAME THIS FILE DOES NOT KNOW IS NOT READY, so a misspelt declaration leaves a screen in
     English rather than turning it Polish in ignorance. */
  let here = "chrome";

  /* Polish is spoken on a screen when the desk asked for it and THAT SCREEN can be spoken
     whole. `force` is the looking door and skips the second half on purpose. */
  const pl = () => lang === "pl" && (forced || readyOn(here));

  /** The engine's counted() rule. */
  /** Which of the three forms a count takes in Polish: one, few (2 to 4, never 12 to 14) or many. */
  function formOf(n) {
    if (n === 1) return "one";
    const ten = n % 10, hundred = n % 100;
    return ten >= 2 && ten <= 4 && !(hundred >= 12 && hundred <= 14) ? "few" : "many";
  }
  function countForm(n, one, many) {
    if (!pl()) return n === 1 ? one : many;
    if (n === 1) return TWIN(one) ? PL[one] : one;
    return formOf(n) === "few" && PL_FEW[many] ? PL_FEW[many] : (TWIN(many) ? PL[many] : many);
  }

  window.STUDIO_T = {
    /* T("English", {vars}) - the English string is the key, the engine's habit, so a reader of
       this file's callers sees the sentence rather than a code for it. */
    T(en, vars) {
      const s = pl() && TWIN(en) ? PL[en] : String(en).replace(CTX, "");
      if (false) return s; /* plant:frames-count */
      return fill(s, vars);
    },

    /* C(n, "{N} card", "{N} cards") - a counted noun, the engine's signature, its number bound
       to the noun by a no-break space in every language. */
    C(n, one, many) {
      return String(countForm(n, one, many)).replace("{N} ", String(n) + NB)
        .replace("{N}", String(n));
    },

    /* screen("cards") before painting the cards, and the name of the screen that was being
       painted comes back, so a painter that nests inside another can put it back. */
    screen(name) { const was = here; here = String(name); return was; },
    at() { return here; },
    screens() { return SCREENS.slice(); },

    /* ready() with a name asks about that screen; without one, whether every screen can be
       spoken, which is what the whole interface used to hang on. */
    ready(name) {
      return name === undefined ? SCREENS.every(readyOn) : readyOn(name);
    },

    /* missing() with a name is that screen's list; without one, every string with no twin,
       each counted once however many screens it keeps English. */
    missing(name) {
      if (name !== undefined) return (NO_TWIN[name] || []).slice();
      const all = [];
      SCREENS.forEach(s => NO_TWIN[s].forEach(x => { if (all.indexOf(x) < 0) all.push(x); }));
      return all;
    },

    table() { return { plain: Object.keys(PL), few: Object.keys(PL_FEW) }; },

    /* form(n): the counted() rule's answer, one, few or many, for a SENTENCE whose verb and noun both turn on the count
       with the number inside it, which C()'s "{N} noun" phrase cannot carry (The month's M5, board 862): the page picks
       one of three frames by it, the few one keyed " ##few". */
    form(n) { return formOf(n); },

    /* The desk's own language. Taken whatever the table holds, because what it decides now is
       one screen at a time rather than all of them at once. */
    set(l) { lang = (l === "pl") ? "pl" : "en"; forced = false; return lang; },

    /* THE DOOR FOR LOOKING AT IT. STUDIO_LANG=pl on the command line opens every screen in
       Polish whether or not its words are all there, so that the words can be judged before the
       last pair has landed and so that a leg can measure them. Nothing in the app calls this,
       and tests/polish.mjs asserts as much over ui/app.js's source: a build that reached for it
       to ship a half-translated screen would be defeating the rule above rather than measuring
       it. An untranslated string falls back to English, visibly. */
    force(l) { lang = (l === "pl" ? "pl" : "en"); forced = true; return lang; },

    lang() { return lang; },
  };
})();
