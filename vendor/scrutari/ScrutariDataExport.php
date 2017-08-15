<?php
namespace scrutari;
use \DOMDocument as DOMDocument;
use \DOMAttr as DOMAttr;

define("SDE_INTITULE_SHORT", 1);
define("SDE_INTITULE_LONG", 2);
define("SDE_INTITULE_CORPUS", 1);
define("SDE_INTITULE_FICHE", 2);
define("SDE_INTITULE_THESAURUS", 1);


/* 
    La classe ScrutariDataExport permet 
    d'ajouter des objets CorpusDataExport et ThesaurusDataExport via les méthodes newCorpus() et newThesaurus(); 
    d'ajouter des index via la méthode addIndexation();
    et d'exporter le XML résultant via la méthode export()
    
    La classe CorpusDataExport permet d'ajouter des objets FicheExport via sa méthode newFiche(); 
    La classe ThesaurusDataExport permet d'ajouter des objets MotcleExport via sa méthode newMotcle()

    Exemple d'utilisation:
        <?php
        use scrutari\ScrutariDataExport as ScrutariDataExport;
        
        $scrutariDataExport = new ScrutariDataExport();
        
        $scrutariDataExport->setAuthority("00019560-d93e-11e0-8cf6-0002a5d5c51b");
        $scrutariDataExport->setBaseName("example");
        $scrutariDataExport->setBaseIcon("http://www.example.com/favicon-16x16.png");
        $scrutariDataExport->setIntitule(SDE_INTITULE_SHORT, "fr", "Example.com");
        $scrutariDataExport->setIntitule(SDE_INTITULE_LONG, "fr", "Exemple - Données de démonstration");
        $scrutariDataExport->addLangUI("fr");
        
        //Création du corpus 'fiche'
        $corpusDataExport = $scrutariDataExport->newCorpus("fiche");
        $corpusDataExport->setIntitule(SDE_INTITULE_CORPUS, "fr","Fiches");
        $corpusDataExport->setIntitule(SDE_INTITULE_FICHE, "fr", "Fiche n°");

        //Création du thesaurus 'motcle'
        $thesaurusDataExport = $scrutariDataExport->newThesaurus('motcle');
        $thesaurusDataExport->setIntitule(SDE_INTITULE_THESAURUS,'fr','Mots-clés');    

        // remplissage des données
        $ficheExport = $corpusDataExport->newFiche(1);
        $ficheExport->setTitre('test');
        $ficheExport->setSoustitre('fiche test');
        $ficheExport->setHref("http://www.example.com/fiche-1");
        $ficheExport->setLang('fr');
        $ficheExport->setDate('2017-01-01');

        // création des mots-clés
        $motcleExport = $thesaurusDataExport->newMotcle(1);
        $motcleExport->setLibelle("fr", 'test');
        $motcleExport = $thesaurusDataExport->newMotcle(2);
        $motcleExport->setLibelle("fr", 'exemple');
        
        // ajout de l'index
        $scrutariDataExport->addIndexation('fiche', 1, 'motcle', 1, 1);
        $scrutariDataExport->addIndexation('fiche', 1, 'motcle', 2, 1);    

        // export du XML résultant
        $xml = $scrutariDataExport->export();
        print($xml);

        
        /** résultat affiché :
        
            <?xml version="1.0" encoding="utf-8"?>
            <base>
              <base-metadata>
                <authority>00019560-d93e-11e0-8cf6-0002a5d5c51b</authority>
                <base-name>example</base-name>
                <base-icon>http://www.example.com/favicon-16x16.png</base-icon>
                <intitule-short>
                  <lib xml:lang="fr">Example.com</lib>
                </intitule-short>
                <intitule-long>
                  <lib xml:lang="fr">Exemple - Données de démonstration</lib>
                </intitule-long>
                <langs-ui>
                  <lang>fr</lang>
                </langs-ui>
              </base-metadata>
              <corpus corpus-name="fiche">
                <corpus-metadata>
                  <intitule-corpus>
                    <lib xml:lang="fr">Fiches</lib>
                  </intitule-corpus>
                  <intitule-fiche>
                    <lib xml:lang="fr">Fiche n°</lib>
                  </intitule-fiche>
                </corpus-metadata>
                <fiche fiche-id="1">
                  <titre>test</titre>
                  <soustitre>fiche test</soustitre>
                  <href>http://www.example.com/fiche-1</href>
                  <lang>fr</lang>
                  <date>2017-01-01</date>
                </fiche>
              </corpus>
              <thesaurus thesaurus-name="motcle">
                <thesaurus-metadata>
                  <intitule-thesaurus>
                    <lib xml:lang="fr">Mots-clés</lib>
                  </intitule-thesaurus>
                </thesaurus-metadata>
                <motcle motcle-id="1">
                  <lib xml:lang="fr">test</lib>
                </motcle>
                <motcle motcle-id="2">
                  <lib xml:lang="fr">exemple</lib>
                </motcle>
              </thesaurus>
              <indexation-group corpus-path="fiche" thesaurus-path="motcle">
                <indexation fiche-id="1" motcle-id="1"/>
                <indexation fiche-id="1" motcle-id="2"/>
              </indexation-group>
            </base>

                
*/


class ScrutariDataExport {
    /* objets DOM */
    private $document;                  // document XML
    private $root;                      // élément root (<base>)
    private $meta;                      // élément des meta données (<base-metadata>)
    
    /* listes d'objets DOM dans <base> */
    private $corpusList = [];           // liste de corpus
    private $thesaurusList = [];        // liste de thesaurus
    
    /* listes d'objets DOM dans <meta> */
    private $langsUIList = [];          // liste des langues
    
    /* cartes de données */
    private $indexationMap = [];        // associations corpus/thesaurus avec (fiche, mot-clé, poids)

    
    public function __construct() {
        // initialisation du document DOM XML
        $this->document = new DOMDocument('1.0', 'utf-8');
        $this->document->preserveWhiteSpace = false;        
        $this->document->formatOutput = true;        

        // initialisation des objets DOM racines
        // $this->root = $this->document->createElement('base');        
        $this->root = $this->document->createElement('base');
        $this->meta = $this->document->createElement('base-metadata');
    }
    
    
    public function export() {
        // construction de la structure DOM (bottom-up)

        // balise langs-ui
        $langsUI = $this->document->createElement('langs-ui');
        foreach($this->langsUIList as $lang) {
            $langsUI->appendChild($this->document->createElement('lang', $lang));            
        }        
        $this->meta->appendChild($langsUI);
        
        // ajouter les meta-données
        $this->root->appendChild($this->meta);
        // ajouter les corpus
        foreach($this->corpusList as $corpusData) {
            $this->root->appendChild($corpusData->export());
        }
        // ajouter les thesaurus
        foreach($this->thesaurusList as $thesaurusData) {
            $this->root->appendChild($thesaurusData->export());
        }        

        foreach($this->indexationMap as $corpusPath => $indexationCorpus) {
            foreach($indexationCorpus as $thesaurusPath => $indexationThesaurus) {
                $group = $this->document->createElement('indexation-group');
                $group->appendChild(new DOMAttr('corpus-path', $corpusPath));
                $group->appendChild(new DOMAttr('thesaurus-path', $thesaurusPath));
                foreach($indexationThesaurus as $indexation) {
                    $elem = $this->document->createElement('indexation');
                    $elem->appendChild(new DOMAttr('fiche-id', $indexation['fiche-id']));
                    $elem->appendChild(new DOMAttr('motcle-id', $indexation['motcle-id']));
                    if($indexation['poids'] > 1) {
                        $elem->appendChild(new DOMAttr('poids', $indexation['poids']));
                    }
                    $group->appendChild($elem);
                }
                $this->root->appendChild($group);
            }
        }
        // export du XML résultant
        $this->document->appendChild($this->root);
        return $this->document->saveXML();
    }


    public function &newCorpus($corpusName) {
        $new_corpus = new CorpusDataExport($this->document, $corpusName);
        $this->corpusList[] = &$new_corpus;
        return $new_corpus; 
    }


    public function &newThesaurus($thesaurusName) {
        $new_thesaurus = new ThesaurusDataExport($this->document, $thesaurusName);
        $this->thesaurusList[] = &$new_thesaurus;
        return $new_thesaurus;        
    }


    public function addIndexation($corpusName, $ficheId, $thesaurusName, $motcleId, $poids) {
        // vérifier que la carte correspondante existe, dans le cas contraire on l'initialise
        if(!isset($this->indexationMap[$corpusName])) $this->indexationMap[$corpusName] = [];
        if(!isset($this->indexationMap[$corpusName][$thesaurusName])) $this->indexationMap[$corpusName][$thesaurusName] = [];
        // ajouter les infos à la carte correspondante
        $this->indexationMap[$corpusName][$thesaurusName][] = [
                                                                'fiche-id'  => $ficheId, 
                                                                'motcle-id' => $motcleId,             
                                                                'poids'     => $poids
                                                              ];
    }

    public function setAuthority($authority) {
        $this->meta->appendChild($this->document->createElement('authority', $authority));
    }

    public function setBaseName($baseName) {
        $this->meta->appendChild($this->document->createElement('base-name', $baseName));
    }

    public function setBaseIcon($baseIcon) {
        $this->meta->appendChild($this->document->createElement('base-icon', $baseIcon));
    }

    public function setIntitule($intituleType, $lang, $intituleValue) {
        switch($intituleType) {
        case SDE_INTITULE_SHORT:    $intitule = $this->document->createElement('intitule-short');                  
            break;
        case SDE_INTITULE_LONG:     $intitule = $this->document->createElement('intitule-long');                
            break;
        default : throw new Exception("Wrong intituleType = " + $intituleType);
        }
        $lib = $this->document->createElement('lib', $intituleValue);
        $lib->appendChild(new DOMAttr('xml:lang', $lang));
        $intitule->appendChild($lib);
        $this->meta->appendChild($intitule);              
    }

    public function addLangUI($lang){        
        $this->langsUIList[] = $lang;
    }
}




class CorpusDataExport {
    /* objets DOM */
    private $document;                  // document XML    
    private $root;                      // élément root (<corpus>)
    private $meta;                      // élément des meta données (<corpus-metadata>)
    

    private $fichesList = [];
    private $complementsList = [];

    
    public function __construct(DOMDocument &$document, $corpusName) {
        $this->document = $document;        
        $this->root = $this->document->createElement('corpus');        
        $this->root->appendChild(new DOMAttr("corpus-name", $corpusName));
        $this->meta = $this->document->createElement('corpus-metadata');
    }
    
    public function export() {
        if(count($this->complementsList)) {
            $complementMeta = $this->document->createElement('complement-metadata');
            foreach($this->complementsList as $complement) {
                foreach($complement as $lang => $intituleValue) {
                    $elem = $this->document->createElement('lib', $intituleValue);
                    $elem->appendChild(new DOMAttr('xml:lang', $lang));
                    $complementMeta->appendChild($elem);
                }
            }
            $this->meta->appendChild($complementMeta);
        }                
        $this->root->appendChild($this->meta);
        foreach($this->fichesList as $fiche) {
            $this->root->appendChild($fiche->export());
        }
        return $this->root;
    }
    
    public function setCorpusIcon($corpusIcon) {
        $this->meta->appendChild($this->document->createElement('corpus-icon', $corpusIcon));
    }

    public function setHrefParent($hrefParent) {
        $this->meta->appendChild($this->document->createElement('href-parent', $hrefParent));
    }
  
    public function setIntitule($intituleType, $lang, $intituleValue) {
        switch($intituleType) {
        case SDE_INTITULE_CORPUS:    $intitule = $this->document->createElement('intitule-corpus');                  
            break;
        case SDE_INTITULE_FICHE:     $intitule = $this->document->createElement('intitule-fiche');                
            break;
        default : throw new Exception("Wrong intituleType = " + $intituleType);
        }
        $lib = $this->document->createElement('lib', $intituleValue);
        $lib->appendChild(new DOMAttr('xml:lang', $lang));
        $intitule->appendChild($lib);
        $this->meta->appendChild($intitule);           
    }  

    /* signature change ? */
    public function addComplement($complementNumber=1, $lang='fr', $intituleValue='') {
        // suggsestion : ajouter directement le complément en utilisant les paramètres de la méthode
        $this->complementsList[] = [];
    }

    public function setComplementIntitule($complementNumber, $lang, $intituleValue) {
        if (($complementNumber < 1) 
            || ($complementNumber > count($this->complementsList))
            || !isset($this->complementsList[$complementNumber-1]) ) {
            return;
        }
        $this->complementsList[$complementNumber-1][$lang] = $intituleValue;
    }
    
    public function &newFiche($ficheId) {
        // vérifier l'absence de conflit d'identifiant
        if(isset($this->fichesList[$ficheId])) {
            $new_fiche = null;
        }
        else {
            $new_fiche = new FicheExport($this->document, $ficheId);        
            $this->fichesList[$ficheId] = &$new_fiche;
        }
        return $new_fiche;
    }    
}





/**
* Implémentation de http://www.scrutari.net/dokuwiki/scrutaridata:exportapi:thesaurusmetadataexport
*/
class ThesaurusDataExport {
    /* objets DOM */
    private $document;                  // document XML    
    private $root;                      // élément root (<thesaurus>)
    private $meta;                      // élément des meta données (<thesaurus-metadata>)
  
    private $motclesList = [];

    
    public function __construct(DOMDocument &$document, $thesaurusName) {
        $this->document = $document;              
        $this->root = $this->document->createElement('thesaurus');        
        $this->root->appendChild(new DOMAttr("thesaurus-name", $thesaurusName));
        $this->meta = $this->document->createElement('thesaurus-metadata');
    }  

    public function export() {
        $this->root->appendChild($this->meta);
        foreach($this->motclesList as $motcle) {
            $this->root->appendChild($motcle->export());
        }
        return $this->root;
    }
    
    public function setIntitule($intituleType, $lang, $intituleValue) {
        switch($intituleType) {
        case SDE_INTITULE_THESAURUS:    $intitule = $this->document->createElement('intitule-thesaurus');                  
            break;
        default : throw new Exception("Wrong intituleType = " + $intituleType);
        }
        $lib = $this->document->createElement('lib', $intituleValue);
        $lib->appendChild(new DOMAttr('xml:lang', $lang));
        $intitule->appendChild($lib);
        $this->meta->appendChild($intitule);           
    }  
  

    public function &newMotcle($motcleId) {
        // vérifier l'absence de conflit d'identifiant
        if(isset($this->motclesList[$motcleId])) {
            $new_motcle = null;
        }
        else {
            $new_motcle = new MotcleExport($this->document, $motcleId);        
            $this->motclesList[$motcleId] = &$new_motcle;
        }
        return $new_motcle;        
    }
  
}



class FicheExport {
    /* objets DOM */
    private $document;                  // document XML    
    private $root;                      // élément root (<fiche>)
    
    public function __construct(DOMDocument &$document, $ficheId) {
        $this->document = $document;              
        $this->root = $this->document->createElement('fiche');
        $this->root->appendChild(new DOMAttr('fiche-id', $ficheId));
    }
    
    public function export() {
        return $this->root;
    }
    
    public function setTitre($titre) {
        $this->root->appendChild($this->document->createElement('titre', $titre));
    }

    public function setSoustitre($soustitre) {
        $this->root->appendChild($this->document->createElement('soustitre', $soustitre));
    }

    public function setDate($date) {
        $this->root->appendChild($this->document->createElement('date', $date));
    }

    public function setLang($lang) {
        $this->root->appendChild($this->document->createElement('lang', $lang));
    }

    public function setHref($href) {
        $this->root->appendChild($this->document->createElement('href', $href));
    }

    public function setFicheIcon($ficheIcon) {
        $this->root->appendChild($this->document->createElement('fiche-icon', $ficheIcon));
    }

    public function addComplement($complementNumber, $complementValue) {      
        $list = $this->root->getElementsByTagName('complement');
        $next = $list->item($complementNumber);
        if($next != null) {
          $this->root->insertBefore($this->document->createElement('complement', $complementValue), $next);
        }
        else $this->root->appendChild($this->document->createElement('complement', $complementValue));
    }
  
    public function addAttributeValue($nameSpace, $localKey, $attributeValue) {
        $attr = $this->document->createElement('attr');
        $attr->appendChild(new DOMAttr('ns', $nameSpace));
        $attr->appendChild(new DOMAttr('key', $localKey));
        $attr->appendChild($this->document->createElement('val', $attributeValue));        
        $this->root->appendChild($attr);        
    }
}

/**
* Implémentation de http://www.scrutari.net/dokuwiki/scrutaridata:exportapi:motcleexport
*/
class MotcleExport {  
    /* objets DOM */
    private $document;                  // document XML        
    private $root;                      // élément root (<motcle>)

    public function __construct(DOMDocument &$document, $motcleId) {
        $this->document = $document;              
        $this->root = $this->document->createElement('motcle');
        $this->root->appendChild(new DOMAttr('motcle-id', $motcleId));
    }

    public function export() {
        return $this->root;
    }
    
    public function setLibelle($lang, $libelleValue) {
        $lib = $this->document->createElement('lib', $libelleValue);
        $lib->appendChild(new DOMAttr('xml:lang', $lang));
        $this->root->appendChild($lib);
    }    
}