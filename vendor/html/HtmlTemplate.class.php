<?php
namespace html;
/**
*	This class implements an html parser that replaces 'var' tags with content stored in associated array (renderer).
*
*
*/
class HtmlTemplate {
	protected $template;	// string containing some html 
	protected $renderer;	// array of functions for rendering template (functions associated with var tags ids)
	protected $params;		// array containing values required by rendering functions
	
	/**
	* Returns html part specified by $attributes, given some additional parameters.
	* This method is called for each 'var' tag. As parameter, it should receive an array with tag attributes (at least 'id'). 
	* Return value should be a string containing html. 
	* To customize its behavior, this method might be overriden in inherited classes
	*
	* @param array $attributes	tag attributes
	*/
	protected function decorator($attributes) {
		if(isset($attributes['id']) && isset($this->renderer[$attributes['id']])) return $this->renderer[$attributes['id']]($this->params, $attributes);
		return '';
	}
	
	public function __construct($template, $renderer, $params=null) {
		$this->setTemplate($template);
		$this->setRenderer($renderer);
		$this->setParams($params);	
	}
	
	public function setTemplate($template) {
		$this->template = $template;
	}

	public function setRenderer($renderer) {
		$this->renderer = $renderer;
	}

	public function setParams($params) {
		$this->params = $params;
	}

	
	/**
	* Replaces 'var' tags with content specified by the decorator method.
	*
	*
	* @param string $template	Some html to parse
	* @return string	html resulting from the processed template 
	*/
	public function getHtml() {
		$previous_pos = 0;
		$html = '';
		// use regular expression to locate all 'var' tags in the template
		preg_match_all("/<var([^>]*)>.*<\/var>/iU", $this->template, $matches, PREG_OFFSET_CAPTURE);
		// replace each 'var' tags with its associated content
		for($i = 0, $j = count($matches[1]); $i < $j; ++$i) {
			// 1) get tag attributes
			$attributes = array();
			$args = explode('" ', ltrim($matches[1][$i][0]));
			foreach($args as $arg) {
				if(!strlen($arg) || !strpos($arg, '=')) continue;
				list($attribute, $value) = explode('=', $arg);
				$attributes[$attribute] = str_replace(array("'", '"'), '', $value);
			}
			// 2) get content pointed by var tag
			$pos = $matches[0][$i][1];
			$len = strlen($matches[0][$i][0]);
			// replace tag with content and build resulting html
			$html .= trim(substr($this->template, $previous_pos, ($pos-$previous_pos)).$this->decorator($attributes));
			$previous_pos = $pos + $len;
		}
		// add trailer
		$html .= substr($this->template, $previous_pos);
		return $html;
	}	
}
