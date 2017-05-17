<?php

/* --------------------------------------------------------------
   TaxZoneSetup.inc.php 2016-12-30
   Gambio GmbH
   http://www.gambio.de
   Copyright (c) 2016 Gambio GmbH
   Released under the GNU General Public License (Version 2)
   [http://www.gnu.org/licenses/gpl-2.0.html]
   --------------------------------------------------------------
*/

class TaxZoneSetup extends TaxZoneSetup_parent 
{
	public function proceed()
	{
		parent::proceed();
		
		$queryBuilder = StaticGXCoreLoader::getDatabaseQueryBuilder();
		
		$tax_normal = '';
		$tax_normal_text = '';
		$tax_special = '';
		$tax_special_text = '';
		$country = STORE_COUNTRY;
		switch ($country) {
			
			case '14':
				// Austria
				$tax_normal = '20.0000';
				$tax_normal_text = '20% MwSt.';
				$tax_special = '10.0000';
				$tax_special_text = '10% MwSt.';
				break;
			case '21':
				// Belgien
				$tax_normal = '21.0000';
				$tax_normal_text = 'UST 21%';
				$tax_special = '6.0000';
				$tax_special_text = 'UST 6%';
				break;
			case '57':
				// Daenemark
				$tax_normal = '25.0000';
				$tax_normal_text = 'UST 25%';
				$tax_special = '25.0000';
				$tax_special_text = 'UST 25%';
				break;
			case '72':
				// Finnland
				$tax_normal = '22.0000';
				$tax_normal_text = 'UST 22%';
				$tax_special = '8.0000';
				$tax_special_text = 'UST 8%';
				break;
			case '73':
				// Frankreich
				$tax_normal = '19.6000';
				$tax_normal_text = 'UST 19.6%';
				$tax_special = '2.1000';
				$tax_special_text = 'UST 2.1%';
				break;
			case '81':
				// Deutschland
				$tax_normal = '19.0000';
				$tax_normal_text = '19% MwSt.';
				$tax_special = '7.0000';
				$tax_special_text = '7% MwSt.';
				break;
			case '84':
				// Griechenland
				$tax_normal = '18.0000';
				$tax_normal_text = 'UST 18%';
				$tax_special = '4.0000';
				$tax_special_text = 'UST 4%';
				break;
			case '103':
				// Irland
				$tax_normal = '21.0000';
				$tax_normal_text = 'UST 21%';
				$tax_special = '4.2000';
				$tax_special_text = 'UST 4.2%';
				break;
			case '105':
				// Italien
				$tax_normal = '20.0000';
				$tax_normal_text = 'UST 20%';
				$tax_special = '4.0000';
				$tax_special_text = 'UST 4%';
				break;
			case '124':
				// Luxemburg
				$tax_normal = '15.0000';
				$tax_normal_text = 'UST 15%';
				$tax_special = '3.0000';
				$tax_special_text = 'UST 3%';
				break;
			case '150':
				// Niederlande
				$tax_normal = '19.0000';
				$tax_normal_text = 'UST 19%';
				$tax_special = '6.0000';
				$tax_special_text = 'UST 6%';
				break;
			case '171':
				// Portugal
				$tax_normal = '17.0000';
				$tax_normal_text = 'UST 17%';
				$tax_special = '5.0000';
				$tax_special_text = 'UST 5%';
				break;
			case '195':
				// Spain
				$tax_normal = '16.0000';
				$tax_normal_text = 'UST 16%';
				$tax_special = '4.0000';
				$tax_special_text = 'UST 4%';
				break;
			case '203':
				// Schweden
				$tax_normal = '25.0000';
				$tax_normal_text = 'UST 25%';
				$tax_special = '6.0000';
				$tax_special_text = 'UST 6%';
				break;
			case '222':
				// UK
				$tax_normal = '17.5000';
				$tax_normal_text = 'UST 17.5%';
				$tax_special = '5.0000';
				$tax_special_text = 'UST 5%';
				break;
			case '204':
				// Switzerland
			case '122':
				// Liechtenstein
				$tax_normal = '8.0000';
				$tax_normal_text = '8% MwSt.';
				$tax_special = '2.5000';
				$tax_special_text = '2,5% MwSt.';
				break;
		}
		
		// Steuerklassen
		$queryBuilder->query("INSERT INTO tax_class (tax_class_id, tax_class_title, tax_class_description, last_modified, date_added) VALUES (1, 'Standardsatz', '', '', now())");
		$queryBuilder->query("INSERT INTO tax_class (tax_class_id, tax_class_title, tax_class_description, last_modified, date_added) VALUES (2, 'ermäßigter Steuersatz', '', NULL, now())");
		
		// Steuersaetze
		$queryBuilder->query("INSERT INTO geo_zones (geo_zone_id, geo_zone_name, geo_zone_description, last_modified, date_added) VALUES (6, 'Steuerzone EU-Ausland', '', '', now())");
		$queryBuilder->query("INSERT INTO geo_zones (geo_zone_id, geo_zone_name, geo_zone_description, last_modified, date_added) VALUES (5, 'Steuerzone EU', 'Steuerzone für die EU', '', now())");
		$queryBuilder->query("INSERT INTO geo_zones (geo_zone_id, geo_zone_name, geo_zone_description, last_modified, date_added) VALUES (7, 'Steuerzone B2B', '', NULL, now())");
		
		if($country == '204' || $country == '122')
		{
			// Steuersaetze / tax_rates
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (1, 5, 1, 1, '0.0000', '0% MwSt.', '', '')");
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (2, 5, 2, 1, '0.0000', '0% MwSt.', '', '')");
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (3, 6, 1, 1, '0.0000', 'EU-AUS-UST 0%', '', '')");
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (4, 6, 2, 1, '0.0000', 'EU-AUS-UST 0%', '', '')");
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (5, 8, 1, 1, '" . $tax_normal . "', '" . $tax_normal_text . "', '', '')");
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (6, 8, 2, 1, '" . $tax_special . "', '" . $tax_special_text . "', '', '')");
			
			// Steuersaetze
			$queryBuilder->query("INSERT INTO geo_zones (geo_zone_id, geo_zone_name, geo_zone_description, last_modified, date_added) VALUES (8, 'Schweiz & Lichtenstein', 'Steuerzone für Schweiz & Lichtenstein', '', now())");
			
			if($country == '204')
			{
				// do not display VAT info under product prices
				$queryBuilder->query("UPDATE `gm_configuration` SET `gm_value` = '0' WHERE `gm_key` = 'DISPLAY_TAX'");
			}
		}
		else
		{
			// Steuerklassen
			$queryBuilder->query("INSERT INTO tax_class (tax_class_id, tax_class_title, tax_class_description, last_modified, date_added) VALUES (3, 'elektronisch erbrachte Leistung', 'EEL', '', now())");
			
			// Steuersaetze / tax_rates
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (1, 5, 1, 1, '" . $tax_normal . "', '" . $tax_normal_text . "', '', '')");
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (2, 5, 2, 1, '" . $tax_special . "', '" . $tax_special_text . "', '', '')");
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (3, 6, 1, 1, '0.0000', 'EU-AUS-UST 0%', '', '')");
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (4, 6, 2, 1, '0.0000', 'EU-AUS-UST 0%', '', '')");
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (5, 11, 3, 1, '19.0000', '19% MwSt. (Deutschland)', '', '')");
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (6, 12, 3, 1, '20.0000', '20% MwSt. (Österreich)', '', '')");
			$queryBuilder->query("INSERT INTO tax_rates (tax_rates_id, tax_zone_id, tax_class_id, tax_priority, tax_rate, tax_description, last_modified, date_added) VALUES (7, 6, 3, 1, '0.0000', 'EU-AUS-UST 0%', '', '')");
			
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(8, 'Belgien', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(9, 'Bulgarien', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(10, 'Dänemark', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(11, 'Deutschland', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(12, 'Österreich', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(13, 'Estland', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(14, 'Finnland', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(15, 'Frankreich', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(16, 'Griechenland', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(17, 'Irland', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(18, 'Italien', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(19, 'Kroatien', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(20, 'Lettland', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(21, 'Litauen', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(22, 'Luxemburg', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(23, 'Malta', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(24, 'Niederlande', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(25, 'Polen', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(26, 'Portugal', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(27, 'Rumänien', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(28, 'Schweden', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(29, 'Slowakei', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(30, 'Slowenien', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(31, 'Spanien', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(32, 'Tschechien', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(33, 'Ungarn', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(34, 'Vereinigtes Königreich', '', NULL, now())");
			$queryBuilder->query("INSERT INTO `geo_zones` (`geo_zone_id`, `geo_zone_name`, `geo_zone_description`, `last_modified`, `date_added`) VALUES(35, 'Zypern', '', NULL, now())");
		}
		
		// EU-Steuerzonen
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (14, 14, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (21, 21, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (53, 53, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (55, 55, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (56, 56, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (57, 57, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (67, 67, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (72, 72, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (73, 73, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (81, 81, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (84, 84, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (97, 97, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (103, 103, 0, 5, now(),now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (105, 105, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (117, 117, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (123, 123, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (124, 124, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (132, 132, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (150, 150, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (170, 170, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (171, 171, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (189, 189, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (190, 190, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (195, 195, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (203, 203, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (222, 222, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (1, 1, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (2, 2, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (3, 3, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (4, 4, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (5, 5, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (6, 6, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (7, 7, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (8, 8, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (9, 9, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (10, 10, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (11, 11, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (12, 12, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (13, 13, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (15, 15, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (16, 16, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (17, 17, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (18, 18, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (19, 19, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (20, 20, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (22, 22, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (23, 23, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (24, 24, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (25, 25, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (26, 26, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (27, 27, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (28, 28, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (29, 29, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (30, 30, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (31, 31, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (32, 32, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (33, 33, 0, 5, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (34, 34, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (35, 35, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (36, 36, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (37, 37, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (38, 38, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (39, 39, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (40, 40, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (41, 41, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (42, 42, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (43, 43, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (44, 44, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (45, 45, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (46, 46, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (47, 47, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (48, 48, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (49, 49, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (50, 50, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (51, 51, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (52, 52, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (54, 54, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (58, 58, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (59, 59, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (60, 60, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (61, 61, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (62, 62, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (63, 63, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (64, 64, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (65, 65, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (66, 66, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (68, 68, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (69, 69, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (70, 70, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (71, 71, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (74, 74, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (75, 75, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (76, 76, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (77, 77, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (78, 78, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (79, 79, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (80, 80, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (82, 82, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (83, 83, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (85, 85, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (86, 86, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (87, 87, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (88, 88, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (89, 89, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (90, 90, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (91, 91, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (92, 92, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (93, 93, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (94, 94, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (95, 95, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (96, 96, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (98, 98, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (99, 99, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (100, 100, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (101, 101, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (102, 102, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (104, 104, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (106, 106, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (107, 107, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (108, 108, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (109, 109, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (110, 110, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (111, 111, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (112, 112, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (113, 113, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (114, 114, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (115, 115, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (116, 116, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (118, 118, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (119, 119, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (120, 120, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (121, 121, 0, 6, now(),  now())");
		
		// store located in Switzerland or Lichtenstein
		if($country == '204' || $country == '122')
		{
			$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (122, 122, 0, 8, now(),  now())");
		}
		else
		{
			$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (122, 122, 0, 6, now(),  now())");
		}
		
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (125, 125, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (126, 126, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (127, 127, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (128, 128, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (129, 129, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (130, 130, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (131, 131, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (133, 133, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (134, 134, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (135, 135, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (136, 136, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (137, 137, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (138, 138, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (139, 139, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (140, 140, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (141, 141, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (142, 142, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (143, 143, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (144, 144, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (145, 145, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (146, 146, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (147, 147, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (148, 148, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (149, 149, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (151, 151, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (152, 152, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (153, 153, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (154, 154, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (155, 155, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (156, 156, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (157, 157, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (158, 158, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (159, 159, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (160, 160, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (161, 161, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (162, 162, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (163, 163, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (164, 164, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (165, 165, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (166, 166, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (167, 167, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (168, 168, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (169, 169, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (172, 172, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (173, 173, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (174, 174, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (175, 175, 0, 5, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (176, 176, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (177, 177, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (178, 178, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (179, 179, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (180, 180, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (181, 181, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (182, 182, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (183, 183, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (184, 184, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (185, 185, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (186, 186, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (187, 187, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (188, 188, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (191, 191, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (192, 192, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (193, 193, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (194, 194, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (196, 196, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (197, 197, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (198, 198, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (199, 199, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (200, 200, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (201, 201, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (202, 202, 0, 6, now(),  now())");
		
		// store located in Switzerland or Lichtenstein
		if($country == '204' || $country == '122')
		{
			$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (204, 204, 0, 8, now(),  now())");
		}
		else
		{
			$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (204, 204, 0, 6, now(),  now())");
		}
		
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (205, 205, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (206, 206, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (207, 207, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (208, 208, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (209, 209, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (210, 210, 0, 6, now(),  now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (211, 211, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (212, 212, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (213, 213, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (214, 214, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (215, 215, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (216, 216, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (217, 217, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (218, 218, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (219, 219, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (220, 220, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (221, 221, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (223, 223, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (224, 224, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (225, 225, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (226, 226, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (227, 227, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (228, 228, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (229, 229, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (230, 230, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (231, 231, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (232, 232, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (233, 233, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (234, 234, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (235, 235, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (236, 236, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (237, 237, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (238, 238, 0, 6, now(), now())");
		$queryBuilder->query("INSERT INTO zones_to_geo_zones (association_id, zone_country_id, zone_id, geo_zone_id, last_modified, date_added) VALUES (239, 239, 0, 6, now(), now())");
		
		// store not located in Switzerland or Lichtenstein
		if($country != '204' && $country != '122')
		{
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(240, 21, 0, 8, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(241, 33, 0, 9, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(242, 57, 0, 10, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(243, 81, 0, 11, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(244, 14, 0, 12, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(245, 67, 0, 13, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(246, 72, 0, 14, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(247, 73, 0, 15, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(248, 84, 0, 16, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(249, 103, 0, 17, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(250, 105, 0, 18, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(251, 53, 0, 19, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(252, 117, 0, 20, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(253, 123, 0, 21, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(254, 124, 0, 22, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(255, 132, 0, 23, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(256, 150, 0, 24, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(257, 170, 0, 25, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(258, 171, 0, 26, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(259, 175, 0, 27, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(260, 203, 0, 28, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(261, 189, 0, 29, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(262, 190, 0, 30, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(263, 195, 0, 31, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(264, 56, 0, 32, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(265, 97, 0, 33, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(266, 222, 0, 34, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES(267, 55, 0, 35, now(), now())");
			$queryBuilder->query("INSERT INTO `zones_to_geo_zones` (`association_id`, `zone_country_id`, `zone_id`, `geo_zone_id`, `last_modified`, `date_added`) VALUES ('', 241, 0, 5, now(), now())");
		}
	}
}