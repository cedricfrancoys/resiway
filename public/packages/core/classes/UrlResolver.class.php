<?php
namespace core {

	class UrlResolver extends \easyobject\orm\Object {

		public static function getColumns() {
			return array(
				'human_readable_url'	=> array('type' => 'string', 'unique' => true),
				'complete_url'			=> array('type' => 'string'),
			);
		}
	}
}