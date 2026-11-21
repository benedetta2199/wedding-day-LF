# Dati di prova — Risposte RSVP

Righe finte per controllare che la **dashboard `/admin`** legga e conti correttamente le risposte.
Le colonne sono identiche a quelle che lo script Apps Script scrive nella scheda **`Risposte RSVP`**.

> Gli ID iniziano tutti con `test-`: così le righe di prova si riconoscono e si cancellano facilmente.

## Come caricarle nel foglio Google

1. Apri il foglio e vai sulla scheda **Risposte RSVP** (la riga 1 con le intestazioni c'è già).
2. Clicca sulla cella **A2** (o sulla prima riga vuota in colonna A).
3. Copia il blocco qui sotto **senza la riga di intestazione** se le intestazioni sono già presenti
   (le righe da `2026-11-18…` in poi) e incollalo con **Ctrl+V**: ogni valore finisce nella sua colonna.
4. Controlla che le colonne *Presenza*, *Celiaco*, *Vegetariano*, *Vegano* mostrino `TRUE`/`FALSE`
   (o `VERO`/`FALSO` se il foglio è in italiano): lo script li riconosce in entrambi i casi.

In alternativa: **File → Importa → Carica** il file [`dati-test-rsvp.csv`](dati-test-rsvp.csv)
e scegli *Aggiungi righe al foglio corrente*.

### Blocco da copiare (separato da tabulazioni)

```tsv
Data	ID risposta	Tipo	Nome	Cognome	Presenza	Riferimento	Celiaco	Vegetariano	Vegano	Altro	Note
2026-11-18 09:12:00	test-001	Principale	Mario	Rossi	TRUE		FALSE	FALSE	FALSE		Arriviamo direttamente al ricevimento
2026-11-18 09:12:00	test-001	Accompagnatore	Anna	Rossi	TRUE	Mario Rossi	FALSE	TRUE	FALSE		
2026-11-18 09:12:00	test-001	Accompagnatore	Luca	Rossi	TRUE	Mario Rossi	FALSE	FALSE	FALSE	Allergia alla frutta secca	Ha 4 anni: serve un seggiolone
2026-11-18 21:40:00	test-002	Principale	Giulia	Bianchi	TRUE		TRUE	FALSE	FALSE		
2026-11-19 08:05:00	test-003	Principale	Paolo	Verdi	FALSE		FALSE	FALSE	FALSE		Purtroppo saremo all'estero, vi pensiamo!
2026-11-19 13:30:00	test-004	Principale	Sara	Neri	TRUE		FALSE	FALSE	TRUE		
2026-11-19 13:30:00	test-004	Accompagnatore	Marco	Gialli	TRUE	Sara Neri	TRUE	TRUE	FALSE		
2026-11-20 18:22:00	test-005	Principale	Elena	Conti	FALSE		FALSE	FALSE	TRUE		
2026-11-21 10:47:00	test-006	Principale	Francesca	Ricci	TRUE		FALSE	FALSE	FALSE		
2026-11-21 10:47:00	test-006	Accompagnatore	Davide	Ricci	TRUE	Francesca Ricci	FALSE	FALSE	FALSE		
2026-11-21 10:47:00	test-006	Accompagnatore	Sofia	Ricci	TRUE	Francesca Ricci	FALSE	FALSE	FALSE	Intolleranza al lattosio	
2026-11-21 10:47:00	test-006	Accompagnatore	Tommaso	Ricci	TRUE	Francesca Ricci	FALSE	FALSE	FALSE		
2026-11-21 19:03:00	test-007	Principale	Niccolò	Fabbri	TRUE		FALSE	FALSE	FALSE		Posso portare la chitarra per la festa?
```

## Anteprima

| Data | ID risposta | Tipo | Nome | Cognome | Presenza | Riferimento | Celiaco | Vegetariano | Vegano | Altro | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-18 09:12:00 | test-001 | Principale | Mario | Rossi | TRUE |  | FALSE | FALSE | FALSE |  | Arriviamo direttamente al ricevimento |
| 2026-11-18 09:12:00 | test-001 | Accompagnatore | Anna | Rossi | TRUE | Mario Rossi | FALSE | TRUE | FALSE |  |  |
| 2026-11-18 09:12:00 | test-001 | Accompagnatore | Luca | Rossi | TRUE | Mario Rossi | FALSE | FALSE | FALSE | Allergia alla frutta secca | Ha 4 anni: serve un seggiolone |
| 2026-11-18 21:40:00 | test-002 | Principale | Giulia | Bianchi | TRUE |  | TRUE | FALSE | FALSE |  |  |
| 2026-11-19 08:05:00 | test-003 | Principale | Paolo | Verdi | FALSE |  | FALSE | FALSE | FALSE |  | Purtroppo saremo all'estero, vi pensiamo! |
| 2026-11-19 13:30:00 | test-004 | Principale | Sara | Neri | TRUE |  | FALSE | FALSE | TRUE |  |  |
| 2026-11-19 13:30:00 | test-004 | Accompagnatore | Marco | Gialli | TRUE | Sara Neri | TRUE | TRUE | FALSE |  |  |
| 2026-11-20 18:22:00 | test-005 | Principale | Elena | Conti | FALSE |  | FALSE | FALSE | TRUE |  |  |
| 2026-11-21 10:47:00 | test-006 | Principale | Francesca | Ricci | TRUE |  | FALSE | FALSE | FALSE |  |  |
| 2026-11-21 10:47:00 | test-006 | Accompagnatore | Davide | Ricci | TRUE | Francesca Ricci | FALSE | FALSE | FALSE |  |  |
| 2026-11-21 10:47:00 | test-006 | Accompagnatore | Sofia | Ricci | TRUE | Francesca Ricci | FALSE | FALSE | FALSE | Intolleranza al lattosio |  |
| 2026-11-21 10:47:00 | test-006 | Accompagnatore | Tommaso | Ricci | TRUE | Francesca Ricci | FALSE | FALSE | FALSE |  |  |
| 2026-11-21 19:03:00 | test-007 | Principale | Niccolò | Fabbri | TRUE |  | FALSE | FALSE | FALSE |  | Posso portare la chitarra per la festa? |

## Cosa deve mostrare la dashboard

Dopo aver incollato i dati premi **Aggiorna** in `/admin` (se nel foglio c'erano già altre risposte, i numeri saranno più alti di conseguenza).

| Riquadro | Valore atteso | Perché |
|---|---|---|
| Persone presenti | **11** su 13 persone indicate | 13 righe, 2 con Presenza = FALSE |
| Risposte ricevute | **7** | 7 ID risposta diversi |
| Ultima risposta | **21 nov, 19:03** | Niccolò Fabbri |
| Accompagnatori | **6** | 2 Rossi + 1 Gialli + 3 Ricci |
| Non ci saranno | **2** | Paolo Verdi, Elena Conti |
| Partecipazione | Presenti 11 (**85%**) · Assenti 2 (**15%**) | |
| Celiaci | **2** | Giulia Bianchi, Marco Gialli |
| Vegetariani | **2** | Anna Rossi, Marco Gialli |
| Vegani | **1** | Sara Neri — *Elena Conti è vegana ma assente: non va contata* |
| Altro | **2** | Luca Rossi (frutta secca), Sofia Ricci (lattosio) |
| Note degli invitati | **4** | Mario Rossi, Luca Rossi, Paolo Verdi, Niccolò Fabbri |

### Controlli sulla tabella "Tutte le risposte"

- La prima riga è **Niccolò Fabbri** (risposta più recente), l'ultima **Mario Rossi**.
- **Mario Rossi** ha 2 accompagnatori (Anna e Luca); **Francesca Ricci** ne ha 3.
- Filtro **Non ci sono** → solo Paolo Verdi ed Elena Conti.
- Ricerca `niccolo` (senza accento) → trova **Niccolò Fabbri**.
- Ricerca `ricci` → trova la risposta di Francesca Ricci (anche cercando `sofia`).
- **Scarica CSV** → file con 13 righe di persone, apribile in Excel con gli accenti corretti.

## Pulizia

Finiti i test, nel foglio seleziona le righe con ID `test-…` → clic destro → **Elimina righe**.
