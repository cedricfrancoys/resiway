<?php
namespace html;

/************************************************************************
*                                                                       *
* Converts HTML to formatted plain text                                 *
* 
* Adapted from original code credited by                                                                       *
* Jon Abernathy <jon@chuggnutt.com>, Copyright (c) 2005                 *
*                                                                       *
*                                                                       *
* This script is free software; you can redistribute it and/or modify   *
* it under the terms of the GNU General Public License as published by  *
* the Free Software Foundation; either version 2 of the License, or     *
* (at your option) any later version.                                   *
*                                                                       *
* The GNU General Public License can be found at                        *
* http://www.gnu.org/copyleft/gpl.html.                                 *
*                                                                       *
* This script is distributed in the hope that it will be useful,        *
* but WITHOUT ANY WARRANTY; without even the implied warranty of        *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the          *
* GNU General Public License for more details.                          *
*                                                                       *
* Author(s): Jon Abernathy <jon@chuggnutt.com>                          *
*                                                                       *
* Last modified: 11/02/06                                               *
*                                                                       *
*************************************************************************/


/**
*  Takes HTML and converts it to formatted, plain text.
*
*  @author Jon Abernathy <jon@chuggnutt.com>
*  @version 0.6.2
*  @since PHP 4.0.2
*/
class HtmlToText {

    /**
     *  Contains the HTML content to convert.
     *
     *  @var string $html
     *  @access public
     */
    var $html;

    /**
     *  Contains the converted, formatted text.
     *
     *  @var string $text
     *  @access public
     */
    var $text;

    /**
     *  Maximum width of the formatted text, in columns.
     *
     *  Set this value to 0 (or less) to ignore word wrapping
     *  and not constrain text to a fixed-width column.
     *
     *  @var integer $width
     *  @access public
     */
    var $width;

    /**
     *  List of preg* regular expression patterns to search for,
     *  used in conjunction with $replace.
     *
     *  @var array $search
     *  @access public
     *  @see $replace
     */
    var $search = array(
        '/<script[^>]*>.*?<\/script>/i',         // <script>s -- which strip_tags supposedly has problems with
        '/<!-- .* -->/',                       // Comments -- which strip_tags might have problem a with
        '/<h[123][^>]*>(.+?)<\/h[123]>/i',      // H1 - H3
        '/<h[456][^>]*>(.+?)<\/h[456]>/i',      // H4 - H6
        '/<p[^>]*>/i',                           // <P>
        '/<br[^>]*>/i',                          // <br>
        '/<b[^>]*>(.+?)<\/b>/i',                // <b>
        '/<i[^>]*>(.+?)<\/i>/i',                 // <i>
        '/(<ul[^>]*>|<\/ul>)/i',                 // <ul> and </ul>
        '/(<ol[^>]*>|<\/ol>)/i',                 // <ol> and </ol>
        '/<li[^>]*>/i',                          // <li>
        '/<\/li[^>]*>/i',                        // </li>
        '/<a href="([^"]+)"[^>]*>(.+?)<\/a>/i', // <a href="">
        '/<hr[^>]*>/i',                          // <hr>
        '/(<table[^>]*>|<\/table>)/i',           // <table> and </table>
        '/(<tr[^>]*>|<\/tr>)/i',                 // <tr> and </tr>
        '/<td[^>]*>(.+?)<\/td>/i',               // <td> and </td>
        '/<th[^>]*>(.+?)<\/th>/i',               // <th> and </th>
        '/&nbsp;/i',
        '/&quot;/i',
        '/&gt;/i',
        '/&lt;/i',
        '/&amp;/i',
        '/&copy;/i',
        '/&trade;/i',
        '/&#8220;/',
        '/&#8221;/',
        '/&#8211;/',
        '/&#8217;/',
        '/&#38;/',
        '/&#39;/',
        '/&#169;/',
        '/&#8482;/',
        '/&#151;/',
        '/&#147;/',
        '/&#148;/',
        '/&#149;/',
        '/&reg;/i',
        '/&bull;/i',
        '/&[&;]+;/i',
        '/&Agrave;/',
        '/&Aacute;/',
        '/&Acirc;/',
        '/&Atilde;/',
        '/&Auml;/',
        '/&Aring;/',
        '/&Aelig;/',
        '/&Ccedil;/',
        '/&Egrave;/',
        '/&Eacute;/',
        '/&Ecirc;/',
        '/&Euml;/',
        '/&Igrave;/',
        '/&Iacute;/',
        '/&Icirc;/',
        '/&Iuml;/',
        '/&Ntilde;/',
        '/&Ograve;/',
        '/&Oacute;/',
        '/&Ocirc;/',
        '/&Otilde;/',
        '/&Ouml;/',
        '/&Oslash;/',
        '/&Ugrave;/',
        '/&Uacute;/',
        '/&Ucirc;/',
        '/&Uuml;/',
        '/&Yuml;/',
        '/&szlig;/',
        '/&agrave;/',
        '/&aacute;/',
        '/&acirc;/',
        '/&atilde;/',
        '/&auml;/',
        '/&aring;/',
        '/&aelig;/',
        '/&ccedil;/',
        '/&egrave;/',
        '/&eacute;/',
        '/&ecirc;/',
        '/&euml;/',
        '/&igrave;/',
        '/&iacute;/',
        '/&icirc;/',
        '/&iuml;/',
        '/&ntilde;/',
        '/&ograve;/',
        '/&oacute;/',
        '/&ocirc;/',
        '/&otilde;/',
        '/&ouml;/',
        '/&oslash;/',
        '/&ugrave;/',
        '/&uacute;/',
        '/&ucirc;/',
        '/&uuml;/',
        '/&yuml;/'
    );

    /**
     *  List of pattern replacements corresponding to patterns searched.
     *
     *  @var array $replace
     *  @access public
     *  @see $search
     */
    var $replace = array(
        '',                                     // <script>s -- which strip_tags supposedly has problems with
        '',                                   // Comments -- which strip_tags might have problem a with
        "## \\1\n\n",          // H1 - H3
        "### \\1\n\n",             // H4 - H6
        "\n\n",                                 // <P>
        "\n",                                   // <br>
        '**\\1**)',                    // <b>
        '_\\1_',                                // <i>
        "\n\n",                                 // <ul> and </ul>
        "\n\n",                                 // <ol> and </ol>
        "\t* ",                                 // <li>
        "\n",                                 	// </li>
        '"\\2 (\\1)"',                          // <a href="">
        "\n----------------------------------------\n",        // <hr>
        "\n\n",                                 // <table> and </table>
        "\n",                                   // <tr> and </tr>
        "\t\t\\1\n",                            // <td> and </td>
        "\t\t\\1\n",            // <th> and </th>
        ' ',
        '"',
        '>',
        '<',
        '&',
        '(c)',
        '(tm)',
        '"',
        '"',
        '-',
        "'",
        '&',
		'\'',		
        '(c)',
        '(tm)',
        '--',
        '"',
        '"',
        '*',
        '(R)',
        '*',
        '',
        'A',
        'A',
        'A',
        'A',
        'A',
        'A',
        'AE',
        'C',
        'E',
        'E',
        'E',
        'E',
        'I',
        'I',
        'I',
        'I',
        'N',
        'O',
        'O',
        'O',
        'O',
        'O',
        'O',
        'U',
        'U',
        'U',
        'U',
        'Y',
        'ss',
        'a',
        'a',
        'a',
        'a',
        'a',
        'a',
        'ae',
        'c',
        'e',
        'e',
        'e',
        'e',
        'i',
        'i',
        'i',
        'i',
        'n',
        'o',
        'o',
        'o',
        'o',
        'o',
        'o',
        'u',
        'u',
        'u',
        'u',
        'y'
    );

    /**
     *  Contains a list of HTML tags to allow in the resulting text.
     *
     *  @var string $allowed_tags
     *  @access public
     *  @see set_allowed_tags()
     */
    var $allowed_tags = '';

    /**
     *  Contains the base URL that relative links should resolve to.
     *
     *  @var string $url
     *  @access public
     */
    var $url;

    /**
     *  Indicates whether content in the $html variable has been converted yet.
     *
     *  @var boolean $converted
     *  @access private
     *  @see $html, $text
     */
    var $_converted = false;

    /**
     *  Contains URL addresses from links to be rendered in plain text.
     *
     *  @var string $link_list
     *  @access private
     *  @see _build_link_list()
     */
    var $_link_list;

    /**
     *  Constructor.
     *
     *  If the HTML source string (or file) is supplied, the class
     *  will instantiate with that source propagated, all that has
     *  to be done it to call get_text().
     *
     *  @param string $source HTML content
     *  @param boolean $from_file Indicates $source is a file to pull content from
     *  @access public
     *  @return void
     */
    function __construct($source='', $width=0, $base_url='')
    {

		$this->html = $source;
		$this->width = $width;
        $this->set_base_url($base_url);

    }

    /**
     *  Returns the text, converted from HTML.
     *
     *  @access public
     *  @return string
     */
    function get_text()
    {
        if ( !$this->_converted ) {
            $this->_convert();
        }

        return $this->text;
    }

    /**
     *  Prints the text, converted from HTML.
     *
     *  @access public
     *  @return void
     */
    function print_text()
    {
        print $this->get_text();
    }

    /**
     *  Alias to print_text(), operates identically.
     *
     *  @access public
     *  @return void
     *  @see print_text()
     */
    function p()
    {
        print $this->get_text();
    }

    /**
     *  Sets the allowed HTML tags to pass through to the resulting text.
     *
     *  Tags should be in the form "<p>", with no corresponding closing tag.
     *
     *  @access public
     *  @return void
     */
    function set_allowed_tags( $allowed_tags = '' )
    {
        if ( !empty($allowed_tags) ) {
            $this->allowed_tags = $allowed_tags;
        }
    }

    /**
     *  Sets a base URL to handle relative links.
     *
     *  @access public
     *  @return void
     */
    function set_base_url( $url = '' )
    {
        if ( empty($url) ) {
            $this->url = 'http://' . $_SERVER['HTTP_HOST'];
        } else {
            // Strip any trailing slashes for consistency (relative
            // URLs may already start with a slash like "/file.html")
            if ( substr($url, -1) == '/' ) {
                $url = substr($url, 0, -1);
            }
            $this->url = $url;
        }
    }

    /**
     *  Workhorse function that does actual conversion.
     *
     *  First performs custom tag replacement specified by $search and
     *  $replace arrays. Then strips any remaining HTML tags, reduces whitespace
     *  and newlines to a readable format, and word wraps the text to
     *  $width characters.
     *
     *  @access private
     *  @return void
     */
    function _convert()
    {
        // Variables used for building the link list
        $link_count = 1;
        $this->_link_list = '';

        $text = trim(stripslashes($this->html));

        // Run our defined search-and-replace
        $text = preg_replace($this->search, $this->replace, $text);

        
        // Strip any other HTML tags
        $text = strip_tags($text, $this->allowed_tags);

        // Wrap the text to a readable format
        // for PHP versions >= 4.0.2. Default width is 75
        // If width is 0 or less, don't wrap the text.
        if ( $this->width > 0 ) {
            $text = wordwrap($text, $this->width);
        }

        $this->text = $text;

        $this->_converted = true;
    }


    function convert() {
        return $this->get_text();
    }

}