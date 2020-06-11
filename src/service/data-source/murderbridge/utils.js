// https://github.com/aramlol/aramlol/blob/master/react/src/components/champion/datapanel/runes/runes.js
export const styles = {
  '8000': [
    {
      runes: [
        {
          id: 8005,
          key: 'PressTheAttack',
          icon: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png',
          name: 'Press the Attack',
          shortDesc:
            'Hitting an enemy champion 3 consecutive times makes them vulnerable, dealing bonus damage and causing them to take more damage from all sources for 6s.',
          longDesc:
            "Hitting an enemy champion with 3 consecutive basic attacks deals 40 - 180 bonus <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_AdaptiveDmg'><font color='#48C4B7'>adaptive damage</font></lol-uikit-tooltipped-keyword> (based on level) and makes them vulnerable, increasing the damage they take by 8 - 12% from all sources for 6s.",
        },
        {
          id: 8008,
          key: 'LethalTempo',
          icon: 'perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png',
          name: 'Lethal Tempo',
          shortDesc:
            '1.5s after damaging a champion gain a large amount of Attack Speed. Lethal Tempo allows you to temporarily exceed the attack speed limit.',
          longDesc:
            '1.5s after damaging a champion gain 40 - 110% Attack Speed (based on level) for 3s. Attacking a champion extends the effect to 6s.<br><br>Cooldown: 6s<br><br>Lethal Tempo allows you to temporarily exceed the attack speed limit.',
        },
        {
          id: 8021,
          key: 'FleetFootwork',
          icon: 'perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png',
          name: 'Fleet Footwork',
          shortDesc:
            "Attacking and moving builds Energy stacks. At 100 stacks, your next attack heals you and grants increased <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_MS'>MS</lol-uikit-tooltipped-keyword>.",
          longDesc:
            'Attacking and moving builds Energy stacks. At 100 stacks, your next attack is Energized<br><br>Energized attacks heal you for 3 - 60 (+0.3 Bonus AD, +0.3 AP) and grant +20% movement speed for 1s.<br><br>Healing from minions is 20% effective for Ranged Champions.',
        },
        {
          id: 8010,
          key: 'Conqueror',
          icon: 'perk-images/Styles/Precision/Conqueror/Conqueror.png',
          name: 'Conqueror',
          shortDesc:
            'Gain stacks of adaptive force when attacking enemy champions. After reaching 10 stacks, heal for a portion of damage you deal to champions.',
          longDesc:
            "Basic attacks or spells that deal damage to an enemy champion grant 2 stacks of Conqueror for 6s, gaining 2-5 <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'><font color='#48C4B7'>Adaptive Force</font></lol-uikit-tooltipped-keyword> per stack. Stacks up to 10 times. Ranged champions gain only 1 stack per basic attack.<br><br>When fully stacked, heal for 15% of the damage you deal to champions (8% for ranged champions).",
        },
      ],
    },
    {
      runes: [
        {
          id: 9101,
          key: 'Overheal',
          icon: 'perk-images/Styles/Precision/Overheal.png',
          name: 'Overheal',
          shortDesc: 'Excess healing on you becomes a shield.',
          longDesc:
            'Excess healing on you becomes a shield, for up to 10 <scaleHealth>(+10% Max Health)</scaleHealth>.<br><br>Shield is built up from 20 to 100% of excess healing from yourself or any ally.',
        },
        {
          id: 9111,
          key: 'Triumph',
          icon: 'perk-images/Styles/Precision/Triumph.png',
          name: 'Triumph',
          shortDesc:
            "<lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>Takedowns</lol-uikit-tooltipped-keyword> restore 12% of your missing health and grant an additional 20 gold. ",
          longDesc:
            "Takedowns restore 12% of your missing health and grant an additional 20 gold. <br><br><hr><br><i>'The most dangerous game brings the greatest glory.' <br>—Noxian Reckoner</i>",
        },
        {
          id: 8009,
          key: 'PresenceOfMind',
          icon: 'perk-images/Styles/Precision/PresenceOfMind/PresenceOfMind.png',
          name: 'Presence of Mind',
          shortDesc: 'Takedowns restore mana or energy and increase their maximum amounts. ',
          longDesc:
            'Takedowns restore 20% of your maximum mana or energy and increase your maximum mana by 100 (up to 500) or your maximum energy by 10 (up to 50). ',
        },
      ],
    },
    {
      runes: [
        {
          id: 9104,
          key: 'LegendAlacrity',
          icon: 'perk-images/Styles/Precision/LegendAlacrity/LegendAlacrity.png',
          name: 'Legend: Alacrity',
          shortDesc:
            "<lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>Takedowns</lol-uikit-tooltipped-keyword> on enemies grant permanent <b>Attack Speed</b>. ",
          longDesc:
            'Gain 3% attack speed plus an additional 1.5% for every <i>Legend</i> stack (<statGood>max 10 stacks</statGood>).<br><br>Earn progress toward <i>Legend</i> stacks for every champion takedown, epic monster takedown, large monster kill, and minion kill.',
        },
        {
          id: 9105,
          key: 'LegendTenacity',
          icon: 'perk-images/Styles/Precision/LegendTenacity/LegendTenacity.png',
          name: 'Legend: Tenacity',
          shortDesc:
            "<lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>Takedowns</lol-uikit-tooltipped-keyword> on enemies grant permanent <b>Tenacity</b>. ",
          longDesc:
            'Gain 5% tenacity plus an additional 2.5% for every <i>Legend</i> stack (<statGood>max 10 stacks</statGood>).<br><br>Earn progress toward <i>Legend</i> stacks for every champion takedown, epic monster takedown, large monster kill, and minion kill.',
        },
        {
          id: 9103,
          key: 'LegendBloodline',
          icon: 'perk-images/Styles/Precision/LegendBloodline/LegendBloodline.png',
          name: 'Legend: Bloodline',
          shortDesc:
            "<lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>Takedowns</lol-uikit-tooltipped-keyword> on enemies grant permanent<b> Lifesteal</b>. Weaker earlier but stronger later game than other Legend Runes.",
          longDesc:
            'Gain 0.6% life steal for every <i>Legend</i> stack (<statGood>max 20 stacks</statGood>).<br><br>Earn progress toward <i>Legend</i> stacks for every champion takedown, epic monster takedown, large monster kill, and minion kill.',
        },
      ],
    },
    {
      runes: [
        {
          id: 8014,
          key: 'CoupDeGrace',
          icon: 'perk-images/Styles/Precision/CoupDeGrace/CoupDeGrace.png',
          name: 'Coup de Grace',
          shortDesc: 'Deal more damage to low health enemy champions.',
          longDesc: 'Deal 8% more damage to champions who have less than 40% health.',
        },
        {
          id: 8017,
          key: 'CutDown',
          icon: 'perk-images/Styles/Precision/CutDown/CutDown.png',
          name: 'Cut Down',
          shortDesc: 'Deal more damage to champions with more max health than you.',
          longDesc:
            'Deal 5% to 15% more damage to champions, based on how much more max health they have than you.<br><br><rules>Bonus damage scales up linearly against enemies with 10% to 100% more max health than you.</rules>',
        },
        {
          id: 8299,
          key: 'LastStand',
          icon: 'perk-images/Styles/Sorcery/LastStand/LastStand.png',
          name: 'Last Stand',
          shortDesc: 'Deal more damage to champions while you are low on health.',
          longDesc:
            'Deal 5% - 11% increased damage to champions while you are below 60% health. Max damage gained at 30% health.',
        },
      ],
    },
  ],
  '8100': [
    {
      runes: [
        {
          id: 8112,
          key: 'Electrocute',
          icon: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
          name: 'Electrocute',
          shortDesc:
            "Hitting a champion with 3 <b>separate</b> attacks or abilities in 3s deals bonus <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_AdaptiveDmg'>adaptive damage</lol-uikit-tooltipped-keyword>.",
          longDesc:
            "Hitting a champion with 3 <b>separate</b> attacks or abilities within 3s deals bonus <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_AdaptiveDmg'><font color='#48C4B7'>adaptive damage</font></lol-uikit-tooltipped-keyword>.<br><br>Damage: 30 - 180 (+0.4 bonus AD, +0.25 AP) damage.<br><br>Cooldown: 25 - 20s<br><br><hr><i>'We called them the Thunderlords, for to speak of their lightning was to invite disaster.'</i>",
        },
        {
          id: 8124,
          key: 'Predator',
          icon: 'perk-images/Styles/Domination/Predator/Predator.png',
          name: 'Predator',
          shortDesc:
            "Add an active effect to your boots that grants a large boost of <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_MS'>MS</lol-uikit-tooltipped-keyword> and causes your next attack or ability to deal bonus <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_AdaptiveDmg'>adaptive damage</lol-uikit-tooltipped-keyword>.",
          longDesc:
            "Enchants your boots with the active effect '<font color='#c60300'>Predator</font>.'<br><br>Channel for 1.5s out of combat to gain 45% movement speed for 15s. Damaging attacks or abilities end this effect, dealing 60 - 180 (+<scaleAD>0.4</scaleAD> bonus AD)(+<scaleAP>0.25</scaleAP> AP) bonus <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_AdaptiveDmg'><font color='#48C4B7'>adaptive damage</font></lol-uikit-tooltipped-keyword>.<br><br>Cooldown: 150s - 100s. Starts the game on cooldown. 50% cooldown if interrupted while channeling.",
        },
        {
          id: 8128,
          key: 'DarkHarvest',
          icon: 'perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png',
          name: 'Dark Harvest',
          shortDesc:
            "Damaging a low health champion inflicts <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_AdaptiveDmg'>adaptive damage</lol-uikit-tooltipped-keyword> and harvests a soul from the victim.",
          longDesc:
            "Damaging a Champion below 50% health deals <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_AdaptiveDmg'>adaptive damage</lol-uikit-tooltipped-keyword> and harvests their soul, permanently increasing Dark Harvest's damage by 5.<br><br>Dark Harvest damage: 20-60 (based on level) (+5 damage per soul) (+0.25 bonus AD) (+0.15 AP)<br>Cooldown: 45s (resets to 1.5s on takedown)",
        },
        {
          id: 9923,
          key: 'HailOfBlades',
          icon: 'perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png',
          name: 'Hail of Blades',
          shortDesc:
            'Gain a large amount of Attack Speed for the first 3 attacks made against enemy champions.',
          longDesc:
            'Gain 110% Attack Speed when you attack an enemy champion for up to 3 attacks.<br><br>No more than 3s can elapse between attacks or this effect will end.<br><br>Cooldown: 8s out of combat with champions.<br><br><rules>Attack resets increase the attack limit by 1.<br>Allows you to temporarily exceed the attack speed limit.</rules>',
        },
      ],
    },
    {
      runes: [
        {
          id: 8126,
          key: 'CheapShot',
          icon: 'perk-images/Styles/Domination/CheapShot/CheapShot.png',
          name: 'Cheap Shot',
          shortDesc:
            "Deal bonus true damage to enemy champions with <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_ImpairAct'>impaired movement or actions</lol-uikit-tooltipped-keyword>. ",
          longDesc:
            'Damaging champions with <b>impaired movement or actions</b> deals 10 - 45 bonus true damage (based on level).<br><br>Cooldown: 4s<br><rules>Activates on damage occurring after the impairment.</rules>',
        },
        {
          id: 8139,
          key: 'TasteOfBlood',
          icon: 'perk-images/Styles/Domination/TasteOfBlood/GreenTerror_TasteOfBlood.png',
          name: 'Taste of Blood',
          shortDesc: 'Heal when you damage an enemy champion.',
          longDesc:
            'Heal when you damage an enemy champion.<br><br>Healing: 18-35 (+0.2 bonus AD, +0.1 AP) health (based on level)<br><br>Cooldown: 20s',
        },
        {
          id: 8143,
          key: 'SuddenImpact',
          icon: 'perk-images/Styles/Domination/SuddenImpact/SuddenImpact.png',
          name: 'Sudden Impact',
          shortDesc:
            'Gain a burst of Lethality and Magic Penetration after using a dash, leap, blink, teleport, or when leaving stealth.',
          longDesc:
            'After exiting stealth or using a dash, leap, blink, or teleport, dealing any damage to a champion grants you 7 Lethality and 6 Magic Penetration for 5s.<br><br>Cooldown: 4s',
        },
      ],
    },
    {
      runes: [
        {
          id: 8136,
          key: 'ZombieWard',
          icon: 'perk-images/Styles/Domination/ZombieWard/ZombieWard.png',
          name: 'Zombie Ward',
          shortDesc:
            "<lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>Takedowns</lol-uikit-tooltipped-keyword> on enemy Wards cause friendly Zombie Wards to sprout from their corpses. Gain permanent AD or AP, <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'>adaptive</lol-uikit-tooltipped-keyword> for each Zombie Ward spawned plus bonus upon completion.",
          longDesc:
            "<lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>Takedowns</lol-uikit-tooltipped-keyword> on enemy Wards cause friendly Zombie Wards to sprout from their corpses.<br><br>Gain an <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'><font color='#48C4B7'>adaptive</font></lol-uikit-tooltipped-keyword> bonus of 1.2 Attack Damage or 2 Ability Power for every Zombie Ward spawned, up to 10. <br><br>After spawning 10 Zombie Wards, additionally gain 10 adaptive force.<br><br>Zombie Wards are visible, last for 120s and do not count towards your ward limit.",
        },
        {
          id: 8120,
          key: 'GhostPoro',
          icon: 'perk-images/Styles/Domination/GhostPoro/GhostPoro.png',
          name: 'Ghost Poro',
          shortDesc:
            "When your wards expire, they leave behind a Ghost Poro. The Ghost Poro grants vision until discovered. Gain permanent AD or AP, <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'>adaptive</lol-uikit-tooltipped-keyword> for each Ghost Poro and when your Ghost Poro spots an enemy champion, plus bonus upon completion.",
          longDesc:
            "When your wards expire, they leave behind a Ghost Poro, which grants vision for 60s. Nearby enemy champions scare the Ghost Poro away.<br><br>Gain an <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'><font color='#48C4B7'>adaptive</font></lol-uikit-tooltipped-keyword> bonus of 1.2 Attack Damage or 2 Ability Power for every Ghost Poro spawned and when your Ghost Poro spots an enemy champion up to 10 stacks. <br><br>After gaining 10 stacks, additionally gain 10 adaptive force.",
        },
        {
          id: 8138,
          key: 'EyeballCollection',
          icon: 'perk-images/Styles/Domination/EyeballCollection/EyeballCollection.png',
          name: 'Eyeball Collection',
          shortDesc:
            "Collect eyeballs for champion <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>takedowns</lol-uikit-tooltipped-keyword>. Gain permanent AD or AP, <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'>adaptive</lol-uikit-tooltipped-keyword> for each eyeball plus bonus upon collection completion.",
          longDesc:
            "Collect eyeballs for champion takedowns. Gain an <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'><font color='#48C4B7'>adaptive</font></lol-uikit-tooltipped-keyword> bonus of 1.2 Attack Damage or 2 Ability Power, per eyeball collected. <br><br>Upon completing your collection at 10 eyeballs, additionally gain an <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'><font color='#48C4B7'>adaptive</font></lol-uikit-tooltipped-keyword> bonus of 6 Attack Damage, or 10 Ability Power.<br><br>Collect 1 eyeball per champion takedown.",
        },
      ],
    },
    {
      runes: [
        {
          id: 8135,
          key: 'RavenousHunter',
          icon: 'perk-images/Styles/Domination/RavenousHunter/RavenousHunter.png',
          name: 'Ravenous Hunter',
          shortDesc:
            "<b>Unique</b> <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>takedowns</lol-uikit-tooltipped-keyword> grant permanent healing from ability damage. ",
          longDesc:
            'Heal for a percentage of the damage dealt by your abilities.<br>Healing: 1.5% + 2.5% per <i>Bounty Hunter</i> stack. <br><br><i>Bounty Hunter</i> stacks are earned the first time you get a takedown on each enemy champion.<br><rules><br>Healing reduced to one third for Area of Effect abilities.</rules>',
        },
        {
          id: 8134,
          key: 'IngeniousHunter',
          icon: 'perk-images/Styles/Domination/IngeniousHunter/IngeniousHunter.png',
          name: 'Ingenious Hunter',
          shortDesc:
            "<b>Unique</b> <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>takedowns</lol-uikit-tooltipped-keyword> grant permanent Active Item <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_CDR'>CDR</lol-uikit-tooltipped-keyword> (includes Trinkets).",
          longDesc:
            'Gain 15% <b>Active Item CDR</b> plus an additional 5% per <i>Bounty Hunter</i> stack (includes Trinkets).<br><br><i>Bounty Hunter</i> stacks are earned the first time you get a takedown on each enemy champion.',
        },
        {
          id: 8105,
          key: 'RelentlessHunter',
          icon: 'perk-images/Styles/Domination/RelentlessHunter/RelentlessHunter.png',
          name: 'Relentless Hunter',
          shortDesc:
            "<b>Unique</b> <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>takedowns</lol-uikit-tooltipped-keyword> grant permanent <b>out of combat <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_MS'>MS</lol-uikit-tooltipped-keyword></b>. ",
          longDesc:
            'Gain 10 <b>out of combat Movement Speed</b> plus 9 per <i>Bounty Hunter</i> stack.<br><br><i>Bounty Hunter</i> stacks are earned the first time you get a takedown on each enemy champion.',
        },
        {
          id: 8106,
          key: 'UltimateHunter',
          icon: 'perk-images/Styles/Domination/UltimateHunter/UltimateHunter.png',
          name: 'Ultimate Hunter',
          shortDesc:
            "<b>Unique</b> <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>takedowns</lol-uikit-tooltipped-keyword> grant permanent cooldown reduction on your Ultimate. ",
          longDesc:
            'Your ultimate gains 5% <b>reduced cooldown,</b> plus an additional 4% per <i>Bounty Hunter</i> stack.<br><br><i>Bounty Hunter</i> stacks are earned the first time you get a takedown on each enemy champion.',
        },
      ],
    },
  ],
  '8200': [
    {
      runes: [
        {
          id: 8214,
          key: 'SummonAery',
          icon: 'perk-images/Styles/Sorcery/SummonAery/SummonAery.png',
          name: 'Summon Aery',
          shortDesc:
            'Your attacks and abilities send Aery to a target, damaging enemies or shielding allies.',
          longDesc:
            'Damaging enemy champions with basic attacks or abilities sends Aery to them, dealing 10 - 40 based on level (+<scaleAP>0.1 AP</scaleAP>) (+<scaleAD>0.15 bonus AD</scaleAD>).<br><br>Empower or protecting allies with abilities sends Aery to them, shielding them for 35 - 80 based on level (+<scaleAP>0.25 AP</scaleAP>) (+<scaleAD>0.4 bonus AD</scaleAD>).<br><br>Aery cannot be sent out again until she returns to you.',
        },
        {
          id: 8229,
          key: 'ArcaneComet',
          icon: 'perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png',
          name: 'Arcane Comet',
          shortDesc:
            'Damaging a champion with an ability hurls a damaging comet at their location.',
          longDesc:
            "Damaging a champion with an ability hurls a comet at their location, or, if Arcane Comet is on cooldown, reduces its remaining cooldown.<br><br><lol-uikit-tooltipped-keyword key='LinkTooltip_Description_AdaptiveDmg'><font color='#48C4B7'>Adaptive Damage</font></lol-uikit-tooltipped-keyword>: 30 - 100 based on level (<scaleAP>+0.2 AP</scaleAP> and <scaleAD>+0.35 bonus AD</scaleAD>)<br>Cooldown: 20 - 8s<br><rules><br>Cooldown Reduction:<br>Single Target: 20%.<br>Area of Effect: 10%.<br>Damage over Time: 5%.<br></rules>",
        },
        {
          id: 8230,
          key: 'PhaseRush',
          icon: 'perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png',
          name: 'Phase Rush',
          shortDesc:
            "Hitting an enemy champion with 3 <b>separate</b> attacks or abilities grants a burst of <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_MS'>MS</lol-uikit-tooltipped-keyword>. ",
          longDesc:
            'Hitting an enemy champion with 3 attacks or <b>separate</b> abilities within 4s grants 25 - 40% Movement Speed based on level and 75% Slow Resistance. <br><br>Movement speed is increased to 40 - 60% for Melee champions.<br><br>Duration: 3s<br>Cooldown: 15s',
        },
      ],
    },
    {
      runes: [
        {
          id: 8224,
          key: 'NullifyingOrb',
          icon: 'perk-images/Styles/Sorcery/NullifyingOrb/Pokeshield.png',
          name: 'Nullifying Orb',
          shortDesc: 'Gain a magic damage shield when taken to low health by magic damage.',
          longDesc:
            'When you take magic damage that would reduce your Health below 30%, gain a shield that absorbs 40 - 120 magic damage based on level (<scaleAP>+0.1 AP</scaleAP> and <scaleAD>+0.15 bonus AD</scaleAD>) for 4s.<br><br>Cooldown: 60s',
        },
        {
          id: 8226,
          key: 'ManaflowBand',
          icon: 'perk-images/Styles/Sorcery/ManaflowBand/ManaflowBand.png',
          name: 'Manaflow Band',
          shortDesc:
            'Hitting an enemy champion with an ability permanently increases your maximum mana by 25, up to 250 mana.<br><br>After reaching 250 bonus mana, restore 1% of your missing mana every 5 seconds.',
          longDesc:
            'Hitting an enemy champion with an ability permanently increases your maximum mana by 25, up to 250 mana.<br><br>After reaching 250 bonus mana, restore 1% of your missing mana every 5 seconds.<br><br>Cooldown: 15 seconds',
        },
        {
          id: 8275,
          key: 'NimbusCloak',
          icon: 'perk-images/Styles/Sorcery/NimbusCloak/6361.png',
          name: 'Nimbus Cloak',
          shortDesc:
            'After casting a Summoner Spell, gain a short movement speed increase that allows you to pass through units.',
          longDesc:
            "After casting a Summoner Spell, gain a movement speed increase that lasts for 2.5s and allows you to pass through units.<br><br>Increase: 15% - 35% Movement Speed based on the Summoner Spell's cooldown. (Higher cooldown Summoner Spells grant more Movement Speed). ",
        },
      ],
    },
    {
      runes: [
        {
          id: 8210,
          key: 'Transcendence',
          icon: 'perk-images/Styles/Sorcery/Transcendence/Transcendence.png',
          name: 'Transcendence',
          shortDesc:
            "Gain 10% <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_CDR'>CDR</lol-uikit-tooltipped-keyword> when you reach level 10. Excess CDR becomes AP or AD, <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'>adaptive</lol-uikit-tooltipped-keyword>.",
          longDesc:
            "Gain 10% CDR when you reach level 10.<br><br>Each percent of CDR exceeding the CDR limit is converted to an <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'><font color='#48C4B7'>adaptive</font></lol-uikit-tooltipped-keyword> bonus of 1.2 Attack Damage or 2 Ability Power.",
        },
        {
          id: 8234,
          key: 'Celerity',
          icon: 'perk-images/Styles/Sorcery/Celerity/CelerityTemp.png',
          name: 'Celerity',
          shortDesc:
            'All movement speed bonuses are 7% more effective on you and gain 1% Movement Speed.',
          longDesc: 'All movement bonuses are 7% more effective on you and gain 1% Movement Speed.',
        },
        {
          id: 8233,
          key: 'AbsoluteFocus',
          icon: 'perk-images/Styles/Sorcery/AbsoluteFocus/AbsoluteFocus.png',
          name: 'Absolute Focus',
          shortDesc:
            "While above 70% health, gain extra <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_AdaptiveDmg'>adaptive damage</lol-uikit-tooltipped-keyword>.",
          longDesc:
            "While above 70% health, gain an <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'><font color='#48C4B7'>adaptive</font></lol-uikit-tooltipped-keyword> bonus of up to 18 Attack Damage or 30 Ability Power (based on level). <br><br>Grants 1.8 Attack Damage or 3 Ability Power at level 1. ",
        },
      ],
    },
    {
      runes: [
        {
          id: 8237,
          key: 'Scorch',
          icon: 'perk-images/Styles/Sorcery/Scorch/Scorch.png',
          name: 'Scorch',
          shortDesc: 'Your first damaging ability hit every 10s burns champions.',
          longDesc:
            'Your next damaging ability hit sets champions on fire dealing 15 - 35 bonus magic damage based on level after 1s.<br><br>Cooldown: 10s',
        },
        {
          id: 8232,
          key: 'Waterwalking',
          icon: 'perk-images/Styles/Sorcery/Waterwalking/Waterwalking.png',
          name: 'Waterwalking',
          shortDesc:
            "Gain <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_MS'>MS</lol-uikit-tooltipped-keyword> and AP or AD, <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'>adaptive</lol-uikit-tooltipped-keyword> in the river.",
          longDesc:
            "Gain 25 Movement Speed and an <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'><font color='#48C4B7'>adaptive</font></lol-uikit-tooltipped-keyword> bonus of up to 18 Attack Damage or 30 Ability Power (based on level) when in the river.<br><br><hr><br><i>May you be as swift as the rushing river and agile as a startled Rift Scuttler.</i><br>",
        },
        {
          id: 8236,
          key: 'GatheringStorm',
          icon: 'perk-images/Styles/Sorcery/GatheringStorm/GatheringStorm.png',
          name: 'Gathering Storm',
          shortDesc:
            "Gain increasing amounts of AD or AP, <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'>adaptive</lol-uikit-tooltipped-keyword> over the course of the game.",
          longDesc:
            "Every 10 min gain AP or AD, <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'><font color='#48C4B7'>adaptive</font></lol-uikit-tooltipped-keyword>.<br><br><i>10 min</i>: + 8 AP or 5 AD <br><i>20 min</i>: + 24 AP or 14 AD<br><i>30 min</i>: + 48 AP or 29 AD<br><i>40 min</i>: + 80 AP or 48 AD<br><i>50 min</i>: + 120 AP or 72 AD<br><i>60 min</i>: + 168 AP or 101 AD<br>etc...",
        },
      ],
    },
  ],
  '8300': [
    {
      runes: [
        {
          id: 8351,
          key: 'GlacialAugment',
          icon: 'perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png',
          name: 'Glacial Augment',
          shortDesc:
            'Your first attack against an enemy champion slows them (per unit cooldown). Slowing champions with active items shoots a freeze ray at them, creating a lingering slow zone.',
          longDesc:
            'Basic attacking a champion slows them for 2s. The slow increases in strength over its duration.<li><i>Ranged</i>: Ranged attacks slow by up to 30% - 40%</li> <li><i>Melee</i>: Melee attacks slow by up to 45% - 55%</li><br>Slowing a champion with active items shoots a freeze ray through them, freezing the nearby ground for 5s, slowing all units inside by 60%.<br><br>Cooldown: 7-4s per unit',
        },
        {
          id: 8360,
          key: 'UnsealedSpellbook',
          icon: 'perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png',
          name: 'Unsealed Spellbook',
          shortDesc:
            'Swap Summoner Spells while out of combat. Swapping to unique Summoner Spells will increase the rate at which you can make future swaps.',
          longDesc:
            'Swap one of your equipped Summoner Spells to a new, single use Summoner Spell. Each unique Summoner Spell you swap to permanently decreases your swap cooldown by 20s (initial swap cooldown is at 4 mins). <br><br>Your first swap becomes available at 6 mins. <br><rules><br>Summoner Spells can only be swapped while out of combat. <br>After using a swapped Summoner Spell you must swap 3 more times before the first can be selected again. </rules>',
        },
        {
          id: 8358,
          key: 'MasterKey',
          icon: 'perk-images/Styles/Inspiration/MasterKey/MasterKey.png',
          name: 'Prototype: Omnistone',
          shortDesc: 'Periodically grants a single use of another random keystone.',
          longDesc:
            'Periodically grants a single use of another random keystone.<br><br>5-3  second cooldown between using a keystone and gaining the next. (9-7 seconds for ranged users)<br><br><rules><br>After 40 seconds of not using a given keystone, Omnistone will re-roll when you exit champion combat.<br>Aftershock is only available to champions who have learned a basic spell that can trigger it.<br>Predator is only available to champions who have already purchased boots.<br></rules>',
        },
      ],
    },
    {
      runes: [
        {
          id: 8306,
          key: 'HextechFlashtraption',
          icon: 'perk-images/Styles/Inspiration/HextechFlashtraption/HextechFlashtraption.png',
          name: 'Hextech Flashtraption',
          shortDesc:
            'While Flash is on cooldown it is replaced by <i>Hexflash</i>.<br><br><i>Hexflash</i>: Channel, then blink to a new location.',
          longDesc:
            'While Flash is on cooldown it is replaced by <i>Hexflash</i>.<br><br><i>Hexflash</i>: Channel for 2s to blink to a new location.<br><br>Cooldown: 20s. Goes on a 10s cooldown when you enter champion combat.',
        },
        {
          id: 8304,
          key: 'MagicalFootwear',
          icon: 'perk-images/Styles/Inspiration/MagicalFootwear/MagicalFootwear.png',
          name: 'Magical Footwear',
          shortDesc:
            "You get free boots at 12 min but you cannot buy boots before then. Each <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>takedown</lol-uikit-tooltipped-keyword> you get makes your boots come 45s sooner.",
          longDesc:
            'You get free Slightly Magical Boots at 12 min, but you cannot buy boots before then. For each takedown you acquire the boots 45s sooner.<br><br>Slightly Magical Boots give you an additional +10 Movement Speed.',
        },
        {
          id: 8313,
          key: 'PerfectTiming',
          icon: 'perk-images/Styles/Inspiration/PerfectTiming/PerfectTiming.png',
          name: 'Perfect Timing',
          shortDesc:
            "Gain a free Commencing Stopwatch. After 14 minutes, it can be used for a one time <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Stasis'>Stasis</lol-uikit-tooltipped-keyword> effect. <br><br>Each <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Takedown'>takedown</lol-uikit-tooltipped-keyword> you get shortens this timer by 120 seconds.",
          longDesc:
            'Begin the game with a Commencing Stopwatch that transforms into a Stopwatch after 14 minutes. Each takedown you acquire reduces this timer by 120 seconds.<br><br>Stopwatch can be used for a one time 2.5 second Stasis effect.',
        },
      ],
    },
    {
      runes: [
        {
          id: 8321,
          key: 'FuturesMarket',
          icon: 'perk-images/Styles/Inspiration/FuturesMarket/FuturesMarket.png',
          name: "Future's Market",
          shortDesc: 'You can enter debt to buy items.',
          longDesc:
            'You can enter debt to buy items. The amount you can borrow increases over time.<br><br>Lending Fee: 50 gold',
        },
        {
          id: 8316,
          key: 'MinionDematerializer',
          icon: 'perk-images/Styles/Inspiration/MinionDematerializer/MinionDematerializer.png',
          name: 'Minion Dematerializer',
          shortDesc:
            'Start the game with 3 Minion Dematerializers. Killing minions with the item gives permanent bonus damage vs. that minion type.',
          longDesc:
            'Start the game with 3 Minion Dematerializers that kill and absorb lane minions instantly. Minion Dematerializers are on cooldown for the first 180s of the game.<br><br>Absorbing a minion increases your damage by +6% against that type of minion permanently, and an extra +3% for each additional minion of that type absorbed.<br>',
        },
        {
          id: 8345,
          key: 'BiscuitDelivery',
          icon: 'perk-images/Styles/Inspiration/BiscuitDelivery/BiscuitDelivery.png',
          name: 'Biscuit Delivery',
          shortDesc:
            'Gain a free Biscuit every 2 min, until 6 min. Consuming or selling a Biscuit permanently increases your max mana and restores health and mana.',
          longDesc:
            'Biscuit Delivery: Gain a Total Biscuit of Everlasting Will every 2 mins, until 6 min.<br><br>Biscuits restore 10% of your missing health and mana. Consuming or selling a Biscuit permanently increases your mana cap by 50. <br><br><i>Manaless:</i> Champions without mana restore 12% missing health instead.',
        },
      ],
    },
    {
      runes: [
        {
          id: 8347,
          key: 'CosmicInsight',
          icon: 'perk-images/Styles/Inspiration/CosmicInsight/CosmicInsight.png',
          name: 'Cosmic Insight',
          shortDesc:
            "+5% <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_CDR'>CDR</lol-uikit-tooltipped-keyword><br>+5% Max CDR<br>+5% Summoner Spell CDR<br>+5% Item CDR",
          longDesc: '+5% CDR<br>+5% Max CDR<br>+5% Summoner Spell CDR<br>+5% Item CDR',
        },
        {
          id: 8410,
          key: 'ApproachVelocity',
          icon: 'perk-images/Styles/Resolve/ApproachVelocity/ApproachVelocity.png',
          name: 'Approach Velocity',
          shortDesc:
            "Bonus <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_MS'>MS</lol-uikit-tooltipped-keyword> towards nearby ally champions that are <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_ImpairMov'>movement impaired</lol-uikit-tooltipped-keyword> or enemy champions that you impair.",
          longDesc:
            'Gain 15% Movement Speed towards nearby ally champions that are movement impaired or enemy champions that you impair. <br><br>Range: 1000',
        },
        {
          id: 8352,
          key: 'TimeWarpTonic',
          icon: 'perk-images/Styles/Inspiration/TimeWarpTonic/TimeWarpTonic.png',
          name: 'Time Warp Tonic',
          shortDesc:
            "Potions and biscuits grant some restoration immediately. Gain <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_MS'>MS</lol-uikit-tooltipped-keyword>  while under their effects.",
          longDesc:
            'Consuming a potion or biscuit grants 50% of its health or mana restoration immediately, but puts that consumable on a short cooldown. In addition, gain 5% Movement Speed while under their effects.<br><br>Cooldown: equal to the duration of the consumable.',
        },
      ],
    },
  ],
  '8400': [
    {
      runes: [
        {
          id: 8437,
          key: 'GraspOfTheUndying',
          icon: 'perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png',
          name: 'Grasp of the Undying',
          shortDesc:
            'Every 4s your next attack on a champion deals bonus magic damage, heals you, and permanently increases your health.',
          longDesc:
            'Every 4s in combat, your next basic attack on a champion will:<li>Deal bonus magic damage equal to 4% of your max health</li><li>Heals you for 2% of your max health</li><li>Permanently increase your health by 5</li><br><rules><i>Ranged Champions:</i> Damage, healing, and permanent health gained reduced by 40%.</rules><br>',
        },
        {
          id: 8439,
          key: 'Aftershock',
          icon: 'perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png',
          name: 'Aftershock',
          shortDesc:
            "After <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Immobilize'>immobilizing</lol-uikit-tooltipped-keyword> an enemy champion gain defenses and later deal a burst of magic damage around you.",
          longDesc:
            'After immobilizing an enemy champion, increase your Armor and Magic Resist by 35 + 80% of your Bonus Resists for 2.5s. Then explode, dealing magic damage to nearby enemies.<br><br>Damage: 25 - 120 (+8% of your bonus health)<br>Cooldown: 20s<br><br>Resistance bonus from Aftershock capped at: 80-150 (based on level)<br>',
        },
        {
          id: 8465,
          key: 'Guardian',
          icon: 'perk-images/Styles/Resolve/Guardian/Guardian.png',
          name: 'Guardian',
          shortDesc:
            "Guard allies you cast spells on and those that are very nearby. If you or a guarded ally would take damage, you're both hasted and granted a shield.",
          longDesc:
            '<i>Guard</i> allies within 175 units of you, and allies you target with spells for 2.5s. While <i>Guarding</i>, if you or the ally take damage, both of you gain a shield and are hasted for 1.5s.<br><br>Cooldown: <scaleLevel>70 - 40</scaleLevel> seconds<br>Shield: <scaleLevel>70 - 150</scaleLevel> + <scaleAP>25%</scaleAP> of your ability power + <scalehealth>12%</scalehealth> of your bonus health.<br>Haste: +20% Movement Speed.',
        },
      ],
    },
    {
      runes: [
        {
          id: 8446,
          key: 'Demolish',
          icon: 'perk-images/Styles/Resolve/Demolish/Demolish.png',
          name: 'Demolish',
          shortDesc: 'Charge up a powerful attack against a tower while near it.',
          longDesc:
            'Charge up a powerful attack against a tower over 3s, while within 600 range of it. The charged attack deals 100 (+35% of your max health) bonus physical damage. <br><br>Cooldown: 45s',
        },
        {
          id: 8463,
          key: 'FontOfLife',
          icon: 'perk-images/Styles/Resolve/FontOfLife/FontOfLife.png',
          name: 'Font of Life',
          shortDesc:
            "<lol-uikit-tooltipped-keyword key='LinkTooltip_Description_ImpairMov'>Impairing</lol-uikit-tooltipped-keyword> the movement of an enemy champion marks them. Your allies heal when attacking champions you've marked. ",
          longDesc:
            'Impairing the movement of an enemy champion marks them for 4s.<br><br>Ally champions who attack marked enemies heal for 5 + 1% of your max health over 2s. ',
        },
        {
          id: 8401,
          key: 'ShieldBash',
          icon: 'perk-images/Styles/Resolve/MirrorShell/MirrorShell.png',
          name: 'Shield Bash',
          shortDesc:
            "Whenever you gain a shield, your next basic attack against a champion deals bonus <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'><font color='#48C4B7'>adaptive</font></lol-uikit-tooltipped-keyword> damage.",
          longDesc:
            "While shielded, gain <scaleLevel>1 - 10</scaleLevel> Armor and Magic Resist based on Level.<br><br>Whenever you gain a new shield,  your next basic attack against a champion deals <scaleLevel>5 - 30</scaleLevel> <scaleHealth>(+1.5% Bonus Health)</scaleHealth> <scaleMana>(+8.5% New Shield Amount)</scaleMana> bonus <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_Adaptive'><font color='#48C4B7'>adaptive</font></lol-uikit-tooltipped-keyword> damage.<br><br>You have up to 2s after the shield expires to use this effect.",
        },
      ],
    },
    {
      runes: [
        {
          id: 8429,
          key: 'Conditioning',
          icon: 'perk-images/Styles/Resolve/Conditioning/Conditioning.png',
          name: 'Conditioning',
          shortDesc:
            'After 12 min gain +9 Armor and +9 Magic Resist and increase your Armor and Magic Resist by 5%.',
          longDesc:
            'After 12 min gain +9 Armor and +9 Magic Resist and increase your Armor and Magic Resist by 5%.',
        },
        {
          id: 8444,
          key: 'SecondWind',
          icon: 'perk-images/Styles/Resolve/SecondWind/SecondWind.png',
          name: 'Second Wind',
          shortDesc:
            'After taking damage from an enemy champion heal back some missing health over time. ',
          longDesc:
            'After taking damage from an enemy champion, heal for 4% of your missing health +6 over 10s.',
        },
        {
          id: 8473,
          key: 'BonePlating',
          icon: 'perk-images/Styles/Resolve/BonePlating/BonePlating.png',
          name: 'Bone Plating',
          shortDesc:
            'After taking damage from an enemy champion, the next 3 spells or attacks you receive from them deal 30-60 less damage.<br><br><br>Duration: 1.5s<br>Cooldown: 45s',
          longDesc:
            'After taking damage from an enemy champion, the next 3 spells or attacks you receive from them deal 30-60 less damage.<br><br><br>Duration: 1.5s<br>Cooldown: 45s',
        },
      ],
    },
    {
      runes: [
        {
          id: 8451,
          key: 'Overgrowth',
          icon: 'perk-images/Styles/Resolve/Overgrowth/Overgrowth.png',
          name: 'Overgrowth',
          shortDesc: 'Gain permanent max health when minions or monsters die near you.',
          longDesc:
            "Absorb life essence from monsters or enemy minions that die near you, permanently gaining 3 maximum health for every 8.<br><br>When you've absorbed 120 monsters or enemy minions, gain an additional 3.5% maximum health.",
        },
        {
          id: 8453,
          key: 'Revitalize',
          icon: 'perk-images/Styles/Resolve/Revitalize/Revitalize.png',
          name: 'Revitalize',
          shortDesc:
            'Heals and shields you cast or receive are 5% stronger and increased by an additional 10% on low health targets.',
          longDesc:
            'Heals and shields you cast or receive are 5% stronger and increased by an additional 10% on targets below 40% health.',
        },
        {
          id: 8242,
          key: 'Unflinching',
          icon: 'perk-images/Styles/Sorcery/Unflinching/Unflinching.png',
          name: 'Unflinching',
          shortDesc:
            'After casting a Summoner Spell, gain Tenacity and Slow Resistance for a short duration. Additionally, gain Tenacity and Slow Resistance for each Summoner Spell on cooldown. ',
          longDesc:
            'After casting a Summoner Spell, gain 15% Tenacity and Slow Resistance for 10s. Additionally, gain 10% Tenacity and Slow Resistance for each Summoner Spell on cooldown. ',
        },
      ],
    },
  ],
};

export const shardOptionOrder = [
  ['5008', '5005', '5007'],
  ['5008', '5002', '5003'],
  ['5001', '5002', '5003'],
];

const settings = {
  champion: {
    disableSpinner: false,
    showSpecialItems: false,
    cutOffPercent: 0.5,
    longRuneDesc: false,
  },
  general: {
    region: 'NA1',
    mean: 2.5,
    ratio: 50,
  },
};
export const generalSettings = settings.general;

function scorer(winRate, frequency, mean, spread) {
  if (frequency === 0) {
    return 0;
  }
  const e = 2.71828;
  let score = 1 / (1 + e ** ((spread / 30) * (mean - frequency)));
  if (frequency < 0.25) {
    score *= frequency ** 2;
  }
  if (frequency > mean) {
    return frequency ** (1 / spread) * winRate ** (spread ** 0.1) * score;
  }
  return winRate * score;
}

export function scoreGenerator(winRate, frequency, mean = generalSettings.mean, general) {
  return scorer(winRate, frequency, mean, 100 - general.ratio);
}

export function runeLookUpGenerator(data) {
  let runesLookUp = {};
  for (let style in data) {
    let counter = 0;
    for (let slot in data[style].slots) {
      let slotInfo = data[style].slots[slot];
      for (let rune in slotInfo.runes) {
        let runeInfo = JSON.parse(JSON.stringify(slotInfo.runes[rune]));
        runeInfo.style = data[style].id;
        runeInfo.primary = counter === 0;
        runeInfo.slot = slot;
        runesLookUp[runeInfo.id] = runeInfo;
      }
      counter++;
    }
  }
  return runesLookUp;
}

function generateOptimalSubPerks(styleOverride, championRunes = {}, runesLookUp) {
  let optimalSubPerk = [];

  Object.keys(styles)
    .filter((style) => {
      return styleOverride ? style === styleOverride : true;
    })
    .forEach((style) => {
      const runes = Object.values(runesLookUp).filter(
        (rune) => +rune.style === +style && rune.slot !== '0',
      );
      let bestScoreSoFar = -1;
      let bestRunesSoFar = [];
      runes.forEach((firstRune) => {
        runes.forEach((secondRune) => {
          if (firstRune.slot !== secondRune.slot) {
            const score =
              scoreGenerator(
                championRunes[firstRune.id].winRate,
                championRunes[firstRune.id].frequency,
                generalSettings.mean,
                generalSettings,
              ) +
              scoreGenerator(
                championRunes[secondRune.id].winRate,
                championRunes[secondRune.id].frequency,
                generalSettings.mean,
                generalSettings,
              );

            if (score > bestScoreSoFar) {
              bestScoreSoFar = score;
              bestRunesSoFar = [firstRune, secondRune, score, style];
            }
          }
        });
      });
      optimalSubPerk.push([...bestRunesSoFar]);
    });
  optimalSubPerk.sort((a, b) => b[2] - a[2]);
  return optimalSubPerk;
}

export function generateOptimalPerks(
  primaryStyleOverride,
  secondaryStyleOverride,
  championRunes = {},
  runesLookUp,
) {
  let bestScoreSoFar = -1;
  let perkStyles = [];

  Object.keys(styles)
    .filter((style) => {
      return primaryStyleOverride ? style === primaryStyleOverride : true;
    })
    .forEach((style) => {
      const slots = styles[style];
      let totalScore = 0;
      const runesSet = [];
      for (let i = 0; i < 4; i += 1) {
        const { runes } = slots[i];
        runes.sort(
          (a, b) =>
            scoreGenerator(
              championRunes[b.id].winRate,
              championRunes[b.id].frequency,
              generalSettings.mean,
              generalSettings,
            ) -
            scoreGenerator(
              championRunes[a.id].winRate,
              championRunes[a.id].frequency,
              generalSettings.mean,
              generalSettings,
            ),
        );
        runesSet.push(runes[0]);
        if (i === 0) {
          totalScore +=
            3 *
            scoreGenerator(
              championRunes[runes[0].id].winRate,
              championRunes[runes[0].id].frequency,
              generalSettings.mean,
              generalSettings,
            );
        } else {
          totalScore += scoreGenerator(
            championRunes[runes[0].id].winRate,
            championRunes[runes[0].id].frequency,
            generalSettings.mean,
            generalSettings,
          );
        }
      }
      if (totalScore > bestScoreSoFar) {
        bestScoreSoFar = totalScore;
      }

      perkStyles.push({
        style,
        mainScore: totalScore,
        runes: runesSet.map((p) => p.id),
      });
    });

  const subPerks = generateOptimalSubPerks(secondaryStyleOverride, championRunes, runesLookUp);

  perkStyles = perkStyles.map((s) => {
    const topSubPerks = subPerks
      .filter((ss) => ss[3] !== s.style)
      .slice(0, 2)
      .map((j) => ({
        runes: [j[0].id, j[1].id],
        subScore: j[2],
        style: j[3],
      }));

    return {
      ...s,
      subPerks: topSubPerks,
    };
  });

  const fragments = shardOptionOrder
    .map((row) => {
      const clone = [...row];
      clone.sort(
        (a, b) =>
          scoreGenerator(
            championRunes[b].winRate,
            championRunes[b].frequency,
            generalSettings.mean,
            generalSettings,
          ) -
          scoreGenerator(
            championRunes[a].winRate,
            championRunes[a].frequency,
            generalSettings.mean,
            generalSettings,
          ),
      );
      return clone[0];
    })
    .map((i) => +i);

  const sortedPerks = perkStyles
    .sort((a, b) => b.mainScore - a.mainScore)
    .reduce((arr, i) => {
      const runeCombos = i.subPerks.map((j) => ({
        totalScore: i.mainScore + j.subScore,
        primaryStyleId: +i.style,
        subStyleId: +j.style,
        selectedPerkIds: i.runes.concat(j.runes).concat(fragments),
      }));

      return arr.concat(runeCombos);
    }, []);

  return sortedPerks;
}
