using Microsoft.Data.Sqlite;
using TacticsGuildIdle.Core;

namespace TenManIdleMods.DataExporter;

internal static class SqliteExporter
{
    public static void Export(DataManager dm, string dbPath)
    {
        if (File.Exists(dbPath))
            File.Delete(dbPath);

        using var conn = new SqliteConnection($"Data Source={dbPath}");
        conn.Open();
        CreateSchema(conn);

        using var tx = conn.BeginTransaction();
        var items = ExportItems(conn, dm);
        var nodes = ExportGatheringNodes(conn, dm);
        var recipes = ExportRecipes(conn, dm);
        var dungeons = ExportDungeons(conn, dm);
        var raids = ExportRaids(conn, dm);
        var quests = ExportQuests(conn, dm);
        ExportCharacterClasses(conn);
        ExportSuffixes(conn);
        var tools = ExportGatheringTools(conn, dm);
        ExportGameConstants(conn);
        tx.Commit();

        ModLogger.Log(
            "DataExporter",
            $"Exported: {items} items, {nodes} nodes, {recipes} recipes, "
                + $"{dungeons} dungeons, {raids} raids, {quests} quests, {tools} tools"
        );
    }

    private static void CreateSchema(SqliteConnection conn)
    {
        conn.Exec(
            """
            CREATE TABLE items (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                rarity TEXT,
                base_value INTEGER,
                max_stack_size INTEGER,
                item_level INTEGER,
                slot TEXT,
                armor_type TEXT,
                combat_power INTEGER,
                material_type TEXT,
                tier INTEGER,
                consumable_type TEXT,
                duration REAL,
                effect_value INTEGER
            );

            CREATE TABLE item_allowed_classes (
                item_id TEXT NOT NULL REFERENCES items(id),
                class TEXT NOT NULL,
                PRIMARY KEY (item_id, class)
            );

            CREATE TABLE gathering_nodes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                skill TEXT NOT NULL,
                required_level INTEGER,
                base_duration REAL
            );

            CREATE TABLE gathering_drops (
                node_id TEXT NOT NULL REFERENCES gathering_nodes(id),
                item_id TEXT NOT NULL,
                min_quantity INTEGER,
                max_quantity INTEGER,
                chance REAL
            );

            CREATE TABLE recipes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                skill TEXT NOT NULL,
                required_level INTEGER,
                duration REAL,
                output_item_id TEXT,
                output_quantity INTEGER,
                gold_cost INTEGER
            );

            CREATE TABLE recipe_ingredients (
                recipe_id TEXT NOT NULL REFERENCES recipes(id),
                item_id TEXT NOT NULL,
                quantity INTEGER
            );

            CREATE TABLE dungeons (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                required_guild_level INTEGER,
                difficulty TEXT,
                recommended_combat_power INTEGER,
                base_duration REAL,
                gold_reward INTEGER,
                experience_reward INTEGER
            );

            CREATE TABLE dungeon_loot (
                dungeon_id TEXT NOT NULL REFERENCES dungeons(id),
                item_id TEXT NOT NULL,
                min_quantity INTEGER,
                max_quantity INTEGER,
                chance REAL
            );

            CREATE TABLE raids (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                required_guild_level INTEGER,
                difficulty TEXT,
                recommended_combat_power INTEGER,
                base_duration REAL,
                gold_reward INTEGER,
                experience_reward INTEGER
            );

            CREATE TABLE raid_loot (
                raid_id TEXT NOT NULL REFERENCES raids(id),
                item_id TEXT NOT NULL,
                min_quantity INTEGER,
                max_quantity INTEGER,
                chance REAL
            );

            CREATE TABLE quests (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                type TEXT,
                min_character_level INTEGER,
                recommended_combat_power INTEGER,
                base_duration REAL,
                gold_reward INTEGER,
                experience_reward INTEGER
            );

            CREATE TABLE quest_rewards (
                quest_id TEXT NOT NULL REFERENCES quests(id),
                item_id TEXT NOT NULL,
                min_quantity INTEGER,
                max_quantity INTEGER,
                chance REAL
            );

            CREATE TABLE character_classes (
                name TEXT PRIMARY KEY,
                armor_type TEXT NOT NULL,
                roles TEXT NOT NULL
            );

            CREATE TABLE suffixes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                combat_power_multiplier REAL
            );

            CREATE TABLE gathering_tools (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                skill TEXT NOT NULL,
                speed_bonus REAL
            );

            CREATE TABLE game_constants (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            """
        );
    }

    private static int ExportItems(SqliteConnection conn, DataManager dm)
    {
        using var itemCmd = conn.CreateCommand();
        itemCmd.CommandText = """
            INSERT INTO items (id, name, category, rarity, base_value, max_stack_size,
                item_level, slot, armor_type, combat_power, material_type, tier,
                consumable_type, duration, effect_value)
            VALUES ($id, $name, $category, $rarity, $base_value, $max_stack_size,
                $item_level, $slot, $armor_type, $combat_power, $material_type, $tier,
                $consumable_type, $duration, $effect_value)
            """;

        var pId = itemCmd.Parameters.Add("$id", SqliteType.Text);
        var pName = itemCmd.Parameters.Add("$name", SqliteType.Text);
        var pCategory = itemCmd.Parameters.Add("$category", SqliteType.Text);
        var pRarity = itemCmd.Parameters.Add("$rarity", SqliteType.Text);
        var pBaseValue = itemCmd.Parameters.Add("$base_value", SqliteType.Integer);
        var pMaxStack = itemCmd.Parameters.Add("$max_stack_size", SqliteType.Integer);
        var pItemLevel = itemCmd.Parameters.Add("$item_level", SqliteType.Integer);
        var pSlot = itemCmd.Parameters.Add("$slot", SqliteType.Text);
        var pArmorType = itemCmd.Parameters.Add("$armor_type", SqliteType.Text);
        var pCombatPower = itemCmd.Parameters.Add("$combat_power", SqliteType.Integer);
        var pMaterialType = itemCmd.Parameters.Add("$material_type", SqliteType.Text);
        var pTier = itemCmd.Parameters.Add("$tier", SqliteType.Integer);
        var pConsumableType = itemCmd.Parameters.Add("$consumable_type", SqliteType.Text);
        var pDuration = itemCmd.Parameters.Add("$duration", SqliteType.Real);
        var pEffectValue = itemCmd.Parameters.Add("$effect_value", SqliteType.Integer);
        itemCmd.Prepare();

        using var classCmd = conn.CreateCommand();
        classCmd.CommandText =
            "INSERT OR IGNORE INTO item_allowed_classes (item_id, class) VALUES ($item_id, $class)";
        var pcItemId = classCmd.Parameters.Add("$item_id", SqliteType.Text);
        var pcClass = classCmd.Parameters.Add("$class", SqliteType.Text);
        classCmd.Prepare();

        var count = 0;
        foreach (var (id, item) in dm.ItemTemplates)
        {
            pId.Value = id;
            pName.Value = item.Name;
            pCategory.Value = item.Category.ToString();
            pRarity.Value = item.Rarity.ToString();
            pBaseValue.Value = item.BaseValue;
            pMaxStack.Value = item.MaxStackSize;
            pItemLevel.Value = item.ItemLevel;
            pSlot.Value = item.Slot?.ToString() ?? (object)DBNull.Value;
            pArmorType.Value = item.ArmorType?.ToString() ?? (object)DBNull.Value;
            pCombatPower.Value = item.CombatPower;
            pMaterialType.Value = item.MaterialType?.ToString() ?? (object)DBNull.Value;
            pTier.Value = item.Tier;
            pConsumableType.Value = item.ConsumableType?.ToString() ?? (object)DBNull.Value;
            pDuration.Value = item.Duration;
            pEffectValue.Value = item.EffectValue;
            itemCmd.ExecuteNonQuery();

            if (item.AllowedClasses != null)
            {
                foreach (var cls in item.AllowedClasses)
                {
                    pcItemId.Value = id;
                    pcClass.Value = cls.ToString();
                    classCmd.ExecuteNonQuery();
                }
            }

            count++;
        }

        return count;
    }

    private static int ExportGatheringNodes(SqliteConnection conn, DataManager dm)
    {
        using var nodeCmd = conn.CreateCommand();
        nodeCmd.CommandText = """
            INSERT INTO gathering_nodes (id, name, skill, required_level, base_duration)
            VALUES ($id, $name, $skill, $required_level, $base_duration)
            """;
        var pId = nodeCmd.Parameters.Add("$id", SqliteType.Text);
        var pName = nodeCmd.Parameters.Add("$name", SqliteType.Text);
        var pSkill = nodeCmd.Parameters.Add("$skill", SqliteType.Text);
        var pLevel = nodeCmd.Parameters.Add("$required_level", SqliteType.Integer);
        var pDuration = nodeCmd.Parameters.Add("$base_duration", SqliteType.Real);
        nodeCmd.Prepare();

        using var dropCmd = conn.CreateCommand();
        dropCmd.CommandText = """
            INSERT INTO gathering_drops (node_id, item_id, min_quantity, max_quantity, chance)
            VALUES ($node_id, $item_id, $min_quantity, $max_quantity, $chance)
            """;
        var pdNodeId = dropCmd.Parameters.Add("$node_id", SqliteType.Text);
        var pdItemId = dropCmd.Parameters.Add("$item_id", SqliteType.Text);
        var pdMin = dropCmd.Parameters.Add("$min_quantity", SqliteType.Integer);
        var pdMax = dropCmd.Parameters.Add("$max_quantity", SqliteType.Integer);
        var pdChance = dropCmd.Parameters.Add("$chance", SqliteType.Real);
        dropCmd.Prepare();

        var count = 0;
        foreach (var (id, node) in dm.GatheringNodes)
        {
            pId.Value = id;
            pName.Value = node.Name;
            pSkill.Value = node.Skill.ToString();
            pLevel.Value = node.RequiredLevel;
            pDuration.Value = node.BaseDuration;
            nodeCmd.ExecuteNonQuery();

            foreach (var drop in node.Drops)
            {
                pdNodeId.Value = id;
                pdItemId.Value = drop.ItemId;
                pdMin.Value = drop.MinQuantity;
                pdMax.Value = drop.MaxQuantity;
                pdChance.Value = drop.Chance;
                dropCmd.ExecuteNonQuery();
            }

            count++;
        }

        return count;
    }

    private static int ExportRecipes(SqliteConnection conn, DataManager dm)
    {
        using var recipeCmd = conn.CreateCommand();
        recipeCmd.CommandText = """
            INSERT INTO recipes (id, name, skill, required_level, duration,
                output_item_id, output_quantity, gold_cost)
            VALUES ($id, $name, $skill, $required_level, $duration,
                $output_item_id, $output_quantity, $gold_cost)
            """;
        var pId = recipeCmd.Parameters.Add("$id", SqliteType.Text);
        var pName = recipeCmd.Parameters.Add("$name", SqliteType.Text);
        var pSkill = recipeCmd.Parameters.Add("$skill", SqliteType.Text);
        var pLevel = recipeCmd.Parameters.Add("$required_level", SqliteType.Integer);
        var pDuration = recipeCmd.Parameters.Add("$duration", SqliteType.Real);
        var pOutputId = recipeCmd.Parameters.Add("$output_item_id", SqliteType.Text);
        var pOutputQty = recipeCmd.Parameters.Add("$output_quantity", SqliteType.Integer);
        var pGold = recipeCmd.Parameters.Add("$gold_cost", SqliteType.Integer);
        recipeCmd.Prepare();

        using var ingredCmd = conn.CreateCommand();
        ingredCmd.CommandText = """
            INSERT INTO recipe_ingredients (recipe_id, item_id, quantity)
            VALUES ($recipe_id, $item_id, $quantity)
            """;
        var piRecipeId = ingredCmd.Parameters.Add("$recipe_id", SqliteType.Text);
        var piItemId = ingredCmd.Parameters.Add("$item_id", SqliteType.Text);
        var piQty = ingredCmd.Parameters.Add("$quantity", SqliteType.Integer);
        ingredCmd.Prepare();

        var count = 0;
        foreach (var (id, recipe) in dm.Recipes)
        {
            pId.Value = id;
            pName.Value = recipe.Name;
            pSkill.Value = recipe.Skill.ToString();
            pLevel.Value = recipe.RequiredLevel;
            pDuration.Value = recipe.Duration;
            pOutputId.Value = recipe.OutputItemId;
            pOutputQty.Value = recipe.OutputQuantity;
            pGold.Value = recipe.GoldCost;
            recipeCmd.ExecuteNonQuery();

            foreach (var ingred in recipe.Ingredients)
            {
                piRecipeId.Value = id;
                piItemId.Value = ingred.ItemId;
                piQty.Value = ingred.Quantity;
                ingredCmd.ExecuteNonQuery();
            }

            count++;
        }

        return count;
    }

    private static int ExportDungeons(SqliteConnection conn, DataManager dm)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO dungeons (id, name, description, required_guild_level, difficulty,
                recommended_combat_power, base_duration, gold_reward, experience_reward)
            VALUES ($id, $name, $description, $required_guild_level, $difficulty,
                $recommended_combat_power, $base_duration, $gold_reward, $experience_reward)
            """;
        var pId = cmd.Parameters.Add("$id", SqliteType.Text);
        var pName = cmd.Parameters.Add("$name", SqliteType.Text);
        var pDesc = cmd.Parameters.Add("$description", SqliteType.Text);
        var pGuildLevel = cmd.Parameters.Add("$required_guild_level", SqliteType.Integer);
        var pDifficulty = cmd.Parameters.Add("$difficulty", SqliteType.Text);
        var pCp = cmd.Parameters.Add("$recommended_combat_power", SqliteType.Integer);
        var pDuration = cmd.Parameters.Add("$base_duration", SqliteType.Real);
        var pGold = cmd.Parameters.Add("$gold_reward", SqliteType.Integer);
        var pXp = cmd.Parameters.Add("$experience_reward", SqliteType.Integer);
        cmd.Prepare();

        using var lootCmd = conn.CreateCommand();
        lootCmd.CommandText = """
            INSERT INTO dungeon_loot (dungeon_id, item_id, min_quantity, max_quantity, chance)
            VALUES ($dungeon_id, $item_id, $min_quantity, $max_quantity, $chance)
            """;
        var plDungeonId = lootCmd.Parameters.Add("$dungeon_id", SqliteType.Text);
        var plItemId = lootCmd.Parameters.Add("$item_id", SqliteType.Text);
        var plMin = lootCmd.Parameters.Add("$min_quantity", SqliteType.Integer);
        var plMax = lootCmd.Parameters.Add("$max_quantity", SqliteType.Integer);
        var plChance = lootCmd.Parameters.Add("$chance", SqliteType.Real);
        lootCmd.Prepare();

        var count = 0;
        foreach (var (id, d) in dm.Dungeons)
        {
            pId.Value = id;
            pName.Value = d.Name;
            pDesc.Value = d.Description;
            pGuildLevel.Value = d.RequiredGuildLevel;
            pDifficulty.Value = d.Difficulty.ToString();
            pCp.Value = d.RecommendedCombatPower;
            pDuration.Value = d.BaseDuration;
            pGold.Value = d.GoldReward;
            pXp.Value = d.ExperienceReward;
            cmd.ExecuteNonQuery();

            foreach (var loot in d.LootTable)
            {
                plDungeonId.Value = id;
                plItemId.Value = loot.ItemId;
                plMin.Value = loot.MinQuantity;
                plMax.Value = loot.MaxQuantity;
                plChance.Value = loot.Chance;
                lootCmd.ExecuteNonQuery();
            }

            count++;
        }

        return count;
    }

    private static int ExportRaids(SqliteConnection conn, DataManager dm)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO raids (id, name, description, required_guild_level, difficulty,
                recommended_combat_power, base_duration, gold_reward, experience_reward)
            VALUES ($id, $name, $description, $required_guild_level, $difficulty,
                $recommended_combat_power, $base_duration, $gold_reward, $experience_reward)
            """;
        var pId = cmd.Parameters.Add("$id", SqliteType.Text);
        var pName = cmd.Parameters.Add("$name", SqliteType.Text);
        var pDesc = cmd.Parameters.Add("$description", SqliteType.Text);
        var pGuildLevel = cmd.Parameters.Add("$required_guild_level", SqliteType.Integer);
        var pDifficulty = cmd.Parameters.Add("$difficulty", SqliteType.Text);
        var pCp = cmd.Parameters.Add("$recommended_combat_power", SqliteType.Integer);
        var pDuration = cmd.Parameters.Add("$base_duration", SqliteType.Real);
        var pGold = cmd.Parameters.Add("$gold_reward", SqliteType.Integer);
        var pXp = cmd.Parameters.Add("$experience_reward", SqliteType.Integer);
        cmd.Prepare();

        using var lootCmd = conn.CreateCommand();
        lootCmd.CommandText = """
            INSERT INTO raid_loot (raid_id, item_id, min_quantity, max_quantity, chance)
            VALUES ($raid_id, $item_id, $min_quantity, $max_quantity, $chance)
            """;
        var plRaidId = lootCmd.Parameters.Add("$raid_id", SqliteType.Text);
        var plItemId = lootCmd.Parameters.Add("$item_id", SqliteType.Text);
        var plMin = lootCmd.Parameters.Add("$min_quantity", SqliteType.Integer);
        var plMax = lootCmd.Parameters.Add("$max_quantity", SqliteType.Integer);
        var plChance = lootCmd.Parameters.Add("$chance", SqliteType.Real);
        lootCmd.Prepare();

        var count = 0;
        foreach (var (id, r) in dm.Raids)
        {
            pId.Value = id;
            pName.Value = r.Name;
            pDesc.Value = r.Description;
            pGuildLevel.Value = r.RequiredGuildLevel;
            pDifficulty.Value = r.Difficulty.ToString();
            pCp.Value = r.RecommendedCombatPower;
            pDuration.Value = r.BaseDuration;
            pGold.Value = r.GoldReward;
            pXp.Value = r.ExperienceReward;
            cmd.ExecuteNonQuery();

            foreach (var loot in r.LootTable)
            {
                plRaidId.Value = id;
                plItemId.Value = loot.ItemId;
                plMin.Value = loot.MinQuantity;
                plMax.Value = loot.MaxQuantity;
                plChance.Value = loot.Chance;
                lootCmd.ExecuteNonQuery();
            }

            count++;
        }

        return count;
    }

    private static int ExportQuests(SqliteConnection conn, DataManager dm)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO quests (id, name, description, type, min_character_level,
                recommended_combat_power, base_duration, gold_reward, experience_reward)
            VALUES ($id, $name, $description, $type, $min_character_level,
                $recommended_combat_power, $base_duration, $gold_reward, $experience_reward)
            """;
        var pId = cmd.Parameters.Add("$id", SqliteType.Text);
        var pName = cmd.Parameters.Add("$name", SqliteType.Text);
        var pDesc = cmd.Parameters.Add("$description", SqliteType.Text);
        var pType = cmd.Parameters.Add("$type", SqliteType.Text);
        var pLevel = cmd.Parameters.Add("$min_character_level", SqliteType.Integer);
        var pCp = cmd.Parameters.Add("$recommended_combat_power", SqliteType.Integer);
        var pDuration = cmd.Parameters.Add("$base_duration", SqliteType.Real);
        var pGold = cmd.Parameters.Add("$gold_reward", SqliteType.Integer);
        var pXp = cmd.Parameters.Add("$experience_reward", SqliteType.Integer);
        cmd.Prepare();

        using var rewardCmd = conn.CreateCommand();
        rewardCmd.CommandText = """
            INSERT INTO quest_rewards (quest_id, item_id, min_quantity, max_quantity, chance)
            VALUES ($quest_id, $item_id, $min_quantity, $max_quantity, $chance)
            """;
        var prQuestId = rewardCmd.Parameters.Add("$quest_id", SqliteType.Text);
        var prItemId = rewardCmd.Parameters.Add("$item_id", SqliteType.Text);
        var prMin = rewardCmd.Parameters.Add("$min_quantity", SqliteType.Integer);
        var prMax = rewardCmd.Parameters.Add("$max_quantity", SqliteType.Integer);
        var prChance = rewardCmd.Parameters.Add("$chance", SqliteType.Real);
        rewardCmd.Prepare();

        var count = 0;
        foreach (var (id, q) in dm.Quests)
        {
            pId.Value = id;
            pName.Value = q.Name;
            pDesc.Value = q.Description;
            pType.Value = q.Type.ToString();
            pLevel.Value = q.MinCharacterLevel;
            pCp.Value = q.RecommendedCombatPower;
            pDuration.Value = q.BaseDuration;
            pGold.Value = q.GoldReward;
            pXp.Value = q.ExperienceReward;
            cmd.ExecuteNonQuery();

            foreach (var reward in q.Rewards)
            {
                prQuestId.Value = id;
                prItemId.Value = reward.ItemId;
                prMin.Value = reward.MinQuantity;
                prMax.Value = reward.MaxQuantity;
                prChance.Value = reward.Chance;
                rewardCmd.ExecuteNonQuery();
            }

            count++;
        }

        return count;
    }

    private static void ExportCharacterClasses(SqliteConnection conn)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText =
            "INSERT INTO character_classes (name, armor_type, roles) VALUES ($name, $armor_type, $roles)";
        var pName = cmd.Parameters.Add("$name", SqliteType.Text);
        var pArmor = cmd.Parameters.Add("$armor_type", SqliteType.Text);
        var pRoles = cmd.Parameters.Add("$roles", SqliteType.Text);
        cmd.Prepare();

        // Hardcoded from Character.GetAvailableRoles() and ContentConstants
        var classes = new (string name, string armor, string roles)[]
        {
            ("Warrior", "Plate", "Tank,DPS"),
            ("Paladin", "Plate", "Tank,Healer,DPS"),
            ("DeathKnight", "Plate", "Tank,DPS"),
            ("Hunter", "Mail", "DPS"),
            ("Rogue", "Leather", "DPS"),
            ("Mage", "Cloth", "DPS"),
            ("Warlock", "Cloth", "DPS"),
            ("Priest", "Cloth", "Healer,DPS"),
            ("Shaman", "Mail", "Healer,DPS"),
            ("Druid", "Leather", "Tank,Healer,DPS"),
            ("Monk", "Leather", "Tank,Healer,DPS"),
        };

        foreach (var (name, armor, roles) in classes)
        {
            pName.Value = name;
            pArmor.Value = armor;
            pRoles.Value = roles;
            cmd.ExecuteNonQuery();
        }
    }

    private static void ExportSuffixes(SqliteConnection conn)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO suffixes (id, name, category, combat_power_multiplier)
            VALUES ($id, $name, $category, $combat_power_multiplier)
            """;
        var pId = cmd.Parameters.Add("$id", SqliteType.Text);
        var pName = cmd.Parameters.Add("$name", SqliteType.Text);
        var pCategory = cmd.Parameters.Add("$category", SqliteType.Text);
        var pMult = cmd.Parameters.Add("$combat_power_multiplier", SqliteType.Real);
        cmd.Prepare();

        foreach (var suffix in SuffixData.AllSuffixes)
        {
            pId.Value = suffix.Id;
            pName.Value = suffix.DisplayName;
            pCategory.Value = suffix.Category.ToString();
            pMult.Value = suffix.CombatPowerMult;
            cmd.ExecuteNonQuery();
        }
    }

    private static int ExportGatheringTools(SqliteConnection conn, DataManager dm)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO gathering_tools (id, name, skill, speed_bonus)
            VALUES ($id, $name, $skill, $speed_bonus)
            """;
        var pId = cmd.Parameters.Add("$id", SqliteType.Text);
        var pName = cmd.Parameters.Add("$name", SqliteType.Text);
        var pSkill = cmd.Parameters.Add("$skill", SqliteType.Text);
        var pBonus = cmd.Parameters.Add("$speed_bonus", SqliteType.Real);
        cmd.Prepare();

        var count = 0;
        foreach (var (id, tool) in dm.GatheringToolTemplates)
        {
            pId.Value = id;
            pName.Value = tool.Name;
            pSkill.Value = tool.Skill.ToString();
            pBonus.Value = tool.SpeedBonus;
            cmd.ExecuteNonQuery();
            count++;
        }

        return count;
    }

    private static void ExportGameConstants(SqliteConnection conn)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "INSERT INTO game_constants (key, value) VALUES ($key, $value)";
        var pKey = cmd.Parameters.Add("$key", SqliteType.Text);
        var pValue = cmd.Parameters.Add("$value", SqliteType.Text);
        cmd.Prepare();

        void Add(string key, string value)
        {
            pKey.Value = key;
            pValue.Value = value;
            cmd.ExecuteNonQuery();
        }

        Add("level_xp_formula", "10.0 * level^1.8");
        Add("gathering_skill_xp_formula", "10.0 * skill_level^1.8");
        Add("crafting_skill_xp_formula", "15.0 * skill_level^1.8");
        Add("max_character_level", "60");
        Add("max_offline_hours", "24");
        Add("offline_gathering_rate", "0.5");
        Add("offline_crafting_rate", "0.5");
        Add("offline_quest_rate", "0.25");
        Add("rarity_cp_multiplier_common", "1.0");
        Add("rarity_cp_multiplier_uncommon", "1.3");
        Add("rarity_cp_multiplier_rare", "1.5");
        Add("rarity_cp_multiplier_epic", "2.2");
        Add("rarity_cp_multiplier_legendary", "3.0");
        Add("rarity_value_multiplier_common", "1.0");
        Add("rarity_value_multiplier_uncommon", "1.4");
        Add("rarity_value_multiplier_rare", "1.8");
        Add("rarity_value_multiplier_epic", "2.8");
        Add("rarity_value_multiplier_legendary", "4.0");
        Add("tier_base_health_formula", "100 + tier^2 * 50 + tier * 25");
        Add("tier_base_attack_formula", "8 + tier * 10 + tier^2 * 2");
        Add("tier_base_defense_formula", "4 + tier * 5 + tier^2");
        Add("tier_base_combat_power_formula", "15 + tier * 12 + tier^2 * 2");
        Add("quest_gold_formula", "5 + level * 3 + level^2 / 10");
        Add("quest_xp_formula", "15 + level * 5 + level^2 / 5");
        Add("quest_duration_formula", "190 + level * 10");
        Add("dungeon_gold_formula", "25 * (tier+1)^2");
        Add("dungeon_xp_formula", "100 * (tier+1) + (tier+1)^2 * 25");
        Add("dungeon_duration_formula", "300 + tier * 180");
        Add("raid_gold_formula", "500 * (index+1)^2");
        Add("raid_xp_formula", "2000 * (index+1)");
        Add("raid_duration_formula", "3600 + index * 1800");
    }

    private static void Exec(this SqliteConnection conn, string sql)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        cmd.ExecuteNonQuery();
    }
}
