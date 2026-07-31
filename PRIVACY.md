# Confidentialité

## Données traitées localement

L’extension peut conserver les métadonnées nécessaires à ses fonctions : identifiants techniques, compte et dossier, objet, auteur, date, état lu, notes saisies, groupes, échéances, règles, historique d’actions et liens Agenda.

Elle ne copie pas dans sa base :

- le corps complet des messages ;
- le contenu des pièces jointes ;
- les mots de passe ou jetons de compte.

## Transmission

La build ne contient aucun appel réseau, télémétrie, publicité ou service de licence. Les données restent dans le profil Thunderbird ou dans un fichier de sauvegarde choisi explicitement par l’utilisateur.

## Sauvegardes et diagnostics

- les sauvegardes sont déclenchées/configurées localement ;
- les exports retirent le chemin de sauvegarde, le calendrier préféré et la matrice de fournisseurs, qui sont propres au profil ;
- le diagnostic expurgé utilise des identifiants hachés ou anonymes et des compteurs ;
- l’utilisateur doit vérifier un fichier avant de le partager : une sauvegarde contient encore les métadonnées nécessaires aux épingles ;
- aucune sauvegarde n’est téléversée automatiquement.

## Suppression

La désinstallation ferme le stockage puis supprime la base, les fichiers de récupération, les préférences et les sauvegardes internes gérées par MailPerch. Dans un dossier externe choisi avec le sélecteur natif, seules les enveloppes MailPerch munies d’un checksum local vérifiable sont supprimées ; les autres fichiers et le dossier sont conservés. Une sentinelle minimale stockée dans la zone locale native de l’extension ne contient aucune donnée utilisateur ; Gecko l’efface à la désinstallation. Son absence lors d’une installation neuve ou d’une réinstallation oblige MailPerch à purger les éventuels résidus avant de charger ses données.

Les exports téléchargés manuellement ne sont pas suivis par l’extension et restent sous le contrôle de l’utilisateur.
