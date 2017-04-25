<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns sitemap file",
    'params' 		=>	array( 
                            'output' =>  array(
                                        'description'   => 'output format (txt, html, json)',
                                        'type'          => 'string', 
                                        'default'       => 'txt'
                                        )     
                        )
	)
);

list($result, $error_message_ids) = [true, []];

// note : as this is an app, if caching is enabled, make sure to empty cache folder on regular basis 
// (or to trigger it when some event occurs)
try {
    
    echo "https://www.resiway.org/resiway.fr".PHP_EOL;
    echo "https://www.resiway.org/resilib.fr".PHP_EOL;
    echo "https://www.resiway.org/resiexchange.fr".PHP_EOL;
    echo "https://www.resiway.org/ekopedia.fr".PHP_EOL;    
    
    
    $om = &ObjectManager::getInstance();
    $questions_ids = $om->search('resiexchange\Question');
    if($questions_ids > 0 && count($questions_ids)){
        $questions = $om->read('resiexchange\Question', $questions_ids, ['id', 'title_url', 'title']);
        foreach($questions as $question_id => $question) {
            switch($params['output']) {
            case 'txt':
                echo "https://www.resiway.org/question/{$question['id']}/{$question['title_url']}".PHP_EOL;
                break;
            case 'html':
                echo '<a href="https://www.resiway.org/question/'.$question['id'].'/'.$question['title_url'].'">'.$question['title'].'</a><br />'.PHP_EOL;
            }
        }
    
    }
    
    // todo : integrate documents to Qinoa
    echo "https://www.resiway.org/document/1/ACF-Action-contre-la-faim_Assemblage-de-filtre-a-sable-pour-le-traitement-de-leau-a-domicile_2008_fr".PHP_EOL;
    echo "https://www.resiway.org/document/2/ACF-Action-contre-la-faim_Projet-de-fabrication-artisanale-de-filtre-a-eau-en-terre-cuite_2008_fr".PHP_EOL;
    echo "https://www.resiway.org/document/3/ACF-Action-contre-la-faim_Rapport-sur-les-filtres-de-type-Bio-Sand-Filters_2008_fr".PHP_EOL;
    echo "https://www.resiway.org/document/4/ANONYMOUS_Tableaux-recapitulatif-plantes-comestibles-cultivees_2014_fr".PHP_EOL;
    echo "https://www.resiway.org/document/5/Aonde-Vamos_Unidade-demonstrativa-de-biodigestor-rural_2008_fr".PHP_EOL;
    echo "https://www.resiway.org/document/6/Association-Entropie_Composteur-a-vegetaux_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/7/Association-Entropie_Deux-bibliotheques-completement-deboulonnees_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/8/Association-Entropie_Le-cuiseur-solaire_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/9/Association-Entropie_Le-four-solaire_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/10/Association-Entropie_Lombricomposteur_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/11/Association-Entropie_Marmitte-norvegienne_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/12/Association-Entropie_Outils-de-jardin_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/13/Association-Entropie_Pisteur-solaire_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/14/BANISTER-Manly_Mulchmaker-for-gardening-buffs_1968_en".PHP_EOL;
    echo "https://www.resiway.org/document/15/BARRA-Lionel_Chauffe-eau-solaire-en-thermosiphon_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/16/BONNEVILLE-Richard_Resistance-des-materiaux-notions-de-base_1998_fr".PHP_EOL;
    echo "https://www.resiway.org/document/17/BONNIOT-Nicolas-JOUAT-Nathalie_Huile-de-friture-recyclee-Utilisation-et-adaptation-pour-moteur_2009_fr".PHP_EOL;
    echo "https://www.resiway.org/document/18/BONNIOT-Nicolas-JOUAT-Nathalie_Le-cuiseur-a-bois_2009_fr".PHP_EOL;
    echo "https://www.resiway.org/document/19/BONNIOT-Nicolas-JOUAT-Nathalie_Le-lave-linge-a-pedales_2009_fr".PHP_EOL;
    echo "https://www.resiway.org/document/20/BONNIOT-Nicolas-JOUAT-Nathalie_Modelisation-dun-cuiseur-solaire-parabolique_2009_fr".PHP_EOL;
    echo "https://www.resiway.org/document/21/BOTERO-Raul-PRESTON-Thomas_Manual-de-instalacion-de-un-biodigestor_2002_es".PHP_EOL;
    echo "https://www.resiway.org/document/22/BREHM-Nicolas_Etude-sur-la-recolte-deau-de-pluie-pour-lusage-alimentaire-en-site-isole_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/23/Bricolaje-Ecologico_La-cocina-con-biogas_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/24/BROUSTEY-Benjamin_Guide-du-Permaculteur-debutant_2012_fr".PHP_EOL;
    echo "https://www.resiway.org/document/25/BWB-Building-Without-Borders_La-construction-en-bottes-de-paille_2003_fr".PHP_EOL;
    echo "https://www.resiway.org/document/26/CARLOS-Cecile_Pour-un-portage-physiologique-et-confortable-Principes-importants_2010_fr".PHP_EOL;
    echo "https://www.resiway.org/document/27/CEDURE-Centro-de-Estudios-para-el-Desarrollo-Urbano-y-Regional_Manual-de-autoconstruccion_2008_es".PHP_EOL;
    echo "https://www.resiway.org/document/28/Centro-Predes_Construccion-de-vivienda-economica-con-adobe-estabilizado_1970_fr".PHP_EOL;
    echo "https://www.resiway.org/document/29/CODEART_Realisation-dun-belier-hydraulique_2009_fr".PHP_EOL;
    echo "https://www.resiway.org/document/30/Colegio-de-Arquitectos-Vasco-Navarro_Arquitectura-bioclimatica_2012_fr".PHP_EOL;
    echo "https://www.resiway.org/document/31/DERY-Patrick_Synthese-des-experimentations-en-architecture-rurale-du-Groupe-de-recherches-ecologiques-de-la-Batture-GREB_2004_fr".PHP_EOL;
    echo "https://www.resiway.org/document/32/DG5SGA_Power-Inverters-12V-to-230V_1999_en".PHP_EOL;
    echo "https://www.resiway.org/document/33/FISCHER-Michel_Alternateur-auto-en-usage-mini-eolienne-deuxieme-partie_2003_fr".PHP_EOL;
    echo "https://www.resiway.org/document/34/FISCHER-Michel_Alternateur-auto-en-usage-mini-eolienne-premiere-partie_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/35/FISCHER-Michel_Batteries-et-energies-renouvelables_2005_fr".PHP_EOL;
    echo "https://www.resiway.org/document/36/FISCHER-Michel_Construire-des-tripales-pour-mini-eolienne_2004_fr".PHP_EOL;
    echo "https://www.resiway.org/document/37/FISCHER-Michel_Construire-ses-pales-pour-mini-eolienne_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/38/FISCHER-Michel_Dimensionnement-de-pales-pour-eolienne-Calculs-des-cordes_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/39/FISCHER-Michel_Energie-eolienne-pour-autoconstructeurs-Infos-de-base_2004_fr".PHP_EOL;
    echo "https://www.resiway.org/document/40/FISCHER-Michel_Energie-solaire-vulgarisation-et-plans_2002_fr".PHP_EOL;
    echo "https://www.resiway.org/document/41/FISCHER-Michel_Generateur-de-courant-continu-en-usage-eolien_2004_fr".PHP_EOL;
    echo "https://www.resiway.org/document/42/FISCHER-Michel_Ma-premiere-eolienne_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/43/FISCHER-Michel_Un-peu-de-technique-sur-les-eoliennes_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/44/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Aseos-secos-del-tipo-Letrina-Abonera_2011_es".PHP_EOL;
    echo "https://www.resiway.org/document/45/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Autoconstruction-dun-capteur-solaire-thermique-tout-en-un_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/46/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Bilan-dune-auto-construction-en-paille_2012_fr".PHP_EOL;
    echo "https://www.resiway.org/document/47/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Conseils-pour-lachat-dun-terrain-en-Espagne_2011_fr".PHP_EOL;
    echo "https://www.resiway.org/document/48/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Consejos-tramites-compra-terreno-en-Espana_2011_es".PHP_EOL;
    echo "https://www.resiway.org/document/49/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Finition-du-gros-oeuvre-dune-maison-en-paille_2011_fr".PHP_EOL;
    echo "https://www.resiway.org/document/50/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Fondations-et-chape-dune-maison-en-paille_2011_fr".PHP_EOL;
    echo "https://www.resiway.org/document/51/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Installation-eau-electricite-dune-maison-en-paille_2011_fr".PHP_EOL;
    echo "https://www.resiway.org/document/52/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Le-complexe-argilo-humique_2014_fr".PHP_EOL;
    echo "https://www.resiway.org/document/53/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Murs-GREB-dune-maison-en-paille_2011_fr".PHP_EOL;
    echo "https://www.resiway.org/document/54/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Produire-son-electricite-avec-une-installation-photovoltaique_2011_fr".PHP_EOL;
    echo "https://www.resiway.org/document/55/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Realisation-dun-systeme-autonome-en-eau-domestique_2012_fr".PHP_EOL;
    echo "https://www.resiway.org/document/56/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Seclairer-avec-des-lampes-a-LED_2014_fr".PHP_EOL;
    echo "https://www.resiway.org/document/57/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_TLB-ou-Toilettes-a-litiere-biomaitrisee_2011_fr".PHP_EOL;
    echo "https://www.resiway.org/document/58/FRANCOYS-Cedric-DEBRABANDERE-Isabelle_Toiture-plate-pour-une-maison-en-paille_2011_fr".PHP_EOL;
    echo "https://www.resiway.org/document/59/Gentiana_Plans-de-construction-de-ruches-Layens-verticales_2008_fr".PHP_EOL;
    echo "https://www.resiway.org/document/60/Gentiana_Plans-de-construction-de-ruches-Warre_2008_fr".PHP_EOL;
    echo "https://www.resiway.org/document/61/GILBERT-Pierre_Dossier-sur-la-maison-en-ballots-de-paille-et-presentation-de-la-technique-GREB_2005_fr".PHP_EOL;
    echo "https://www.resiway.org/document/62/GRENIER-Pascal_Autoconstruction-dun-composteur-domestique_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/63/GRIHASTHI_The-farmers-handbook-Improved-stove_2007_fr".PHP_EOL;
    echo "https://www.resiway.org/document/64/GUERIN-Frederic_Le-compost-Introduction-aux-principes-du-compostage-pour-lamelioration-de-la-fertilite-des-sols_2010_fr".PHP_EOL;
    echo "https://www.resiway.org/document/65/GUILLAUME-Jean-Claude_Lapiculture-ecologique_2014_fr".PHP_EOL;
    echo "https://www.resiway.org/document/66/HEAF-David_Plans-for-the-construction-of-the-peoples-hive_2010_en".PHP_EOL;
    echo "https://www.resiway.org/document/67/HIREL-Yannick_Enrichir-sa-terre-pendant-lhiver_2012_fr".PHP_EOL;
    echo "https://www.resiway.org/document/68/IEV-In-Eau-Vent_Une-pompe-a-eau-en-bois-Conception_2007_fr".PHP_EOL;
    echo "https://www.resiway.org/document/69/IEV-In-Eau-Vent_Une-pompe-a-eau-en-bois-Montage_2007_fr".PHP_EOL;
    echo "https://www.resiway.org/document/70/JONES-Barbara_Una-guia-de-construccion-con-balas-de-paja_2001_es".PHP_EOL;
    echo "https://www.resiway.org/document/71/KROON-Ferdinand_The-Breurram_2003_en".PHP_EOL;
    echo "https://www.resiway.org/document/72/LORTHIOIS-Bruno_Bassin-de-phytoepuration-en-ferro-ciment_2012_fr".PHP_EOL;
    echo "https://www.resiway.org/document/73/LORTHIOIS-Bruno_Chauffe-eau-solaire-simplifie_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/74/LORTHIOIS-Bruno_Serre-bio-climatique_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/75/LOUMA-Roberto-_Ceta-Ram-Una-maquina-para-producir-bloques-huecos-de-suelo-cemento_1977_es".PHP_EOL;
    echo "https://www.resiway.org/document/76/Machtelt-Garrels_Book-introduction-to-Linux-system_2008_fr".PHP_EOL;
    echo "https://www.resiway.org/document/77/MAUNOURY-Axel_Doit-on-renoncer-a-la-Taille_2010_fr".PHP_EOL;
    echo "https://www.resiway.org/document/78/MOL-Adriaan-FEWSTER-Eric_Bio-Sand-filtration-Filter-construction-guidelines-2010.pdf_2010_en".PHP_EOL;
    echo "https://www.resiway.org/document/79/MOL-Adriaan-FEWSTER-Eric_Bio-Sand-filtration-Mould-construction-guidelines_2007_en".PHP_EOL;
    echo "https://www.resiway.org/document/80/MOL-Adriaan_Bio-Sand-filtration-Filter-construction-guidelines_2010_fr".PHP_EOL;
    echo "https://www.resiway.org/document/81/MOL-Adriaan_Bio-Sand-filtration-Mould-construction-guidelines_2007_fr".PHP_EOL;
    echo "https://www.resiway.org/document/82/MOUSSU-Nicolas_Realisation-dun-four-a-pain-en-terre-crue_2005_fr".PHP_EOL;
    echo "https://www.resiway.org/document/83/Observatoire-Participatif-des-Vers-de-Terre_Mieux-Connaitre-les-vers-de-terre_2011_fr".PHP_EOL;
    echo "https://www.resiway.org/document/84/PFEIFFER-Marc_Constituants-du-beton-Recapitulatif-technique_2007_fr".PHP_EOL;
    echo "https://www.resiway.org/document/85/PINEAU-Laurent_Construction-dun-chauffe-eau-solaire_2008_fr".PHP_EOL;
    echo "https://www.resiway.org/document/86/RADABAUGH-Joe_Fabriquer-et-utiliser-un-four-solaire_1998_fr".PHP_EOL;
    echo "https://www.resiway.org/document/87/RAFFA_Le-Grand-Menage-Recettes-ecologiques-et-economiques-pour-lentretien-de-la-maison_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/88/RESIWAY_Charte-pour-une-plateforme-resiliente_2017_fr".PHP_EOL;
    echo "https://www.resiway.org/document/89/RESIWAY_Fonctionnement-de-Resilib_2016_fr".PHP_EOL;
    echo "https://www.resiway.org/document/90/RESIWAY_Presentation-de-Resilib_2016_fr".PHP_EOL;
    echo "https://www.resiway.org/document/91/RISTORI-Camille_Alimentation-de-lane-Rappels-elementaires_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/92/RODRIGUEZ-Lylian-PRESTON-Thomas_Biodigester-installation-manual_2000_en".PHP_EOL;
    echo "https://www.resiway.org/document/93/RODRIGUEZ-Lylian-PRESTON-Thomas_Manuel-dinstallation-dun-biodigesteur_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/94/SCI-Solar-Cookers-International_Cuiseurs-solaires-Comment-construire-employer-et-apprecier_2004_fr".PHP_EOL;
    echo "https://www.resiway.org/document/95/SIAPE-SImpliquer-et-Agir-pour-lEnvironnement_Le-sechage-solaire_2010_fr".PHP_EOL;
    echo "https://www.resiway.org/document/96/SIMPSON-Stephen_A-homebuilt-threshing-machine-for-smallholders_2011_fr".PHP_EOL;
    echo "https://www.resiway.org/document/97/STD-Sunseed-Technologia-del-Desierto_Un-metodo-simple-para-realizar-inoculos-micorricicos_2006_es".PHP_EOL;
    echo "https://www.resiway.org/document/98/STILL-Dean-KNESS-Jim_Capturing-HEAT_2006_en".PHP_EOL;
    echo "https://www.resiway.org/document/99/TAMAT-Julio_Edificar-con-madera_2008_fr".PHP_EOL;
    echo "https://www.resiway.org/document/100/Terre-Vivante_Les-greffes-a-Terre-Vivante_2001_fr".PHP_EOL;
    echo "https://www.resiway.org/document/101/TIERRAMOR_Manejo-sustentable-de-Agua_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/102/TIERRAMOR_Sanitarios-secos-y-composteros_2006_fr".PHP_EOL;
    echo "https://www.resiway.org/document/103/TMTJ-tamaisontonjardin.net_Fours-a-pain-en-terre_2005_fr".PHP_EOL;
    echo "https://www.resiway.org/document/104/WALLNER-Richard_Couverture-de-myscanthus-et-BREFT_2012_fr".PHP_EOL;
    echo "https://www.resiway.org/document/105/WALLNER-Richard_Eau-de-pluie-et-irrigation-par-gravite-a-tres-basse-pression_2012_fr".PHP_EOL;
    echo "https://www.resiway.org/document/106/WALLNER-Richard_Experimentation-butte-ergonomique_2009_fr".PHP_EOL;
    echo "https://www.resiway.org/document/107/WALLNER-Richard_Le-semis-de-surface_2012_fr".PHP_EOL;
    echo "https://www.resiway.org/document/108/WALLNER-Richard_Le-tassement-des-buttes-de-culture_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/109/WALLNER-Richard_Manuel-de-jardinage-pour-debutants_2013_fr".PHP_EOL;
    echo "https://www.resiway.org/document/110/WALLNER-Richard_Notes-pour-faire-une-butte-professionnelle_2009_fr".PHP_EOL;
    echo "https://www.resiway.org/document/111/WALLNER-Richard_Proposition-de-culture-sur-butte-pour-debutant_2010_fr".PHP_EOL;
    echo "https://www.resiway.org/document/112/WALLNER-Richard_Synthese-culture-sur-butte_2009_fr".PHP_EOL;
    echo "https://www.resiway.org/document/113/WILSON-Jo_A-thermosyphon-solar-water-heater-system-for-a-hospital-laundry_2011_en".PHP_EOL;

    exit();
}
catch(Exception $e) {
    $error_message_ids = array($e->getMessage());
    $result = $e->getCode();
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
                    'result'            => $result, 
                    'error_message_ids' => $error_message_ids
                 ], JSON_PRETTY_PRINT);