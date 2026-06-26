require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

const TOKEN      = process.env.BOT_TOKEN;
const CLIENT_ID  = process.env.CLIENT_ID;
const VOUCH_CHANNEL_ID = process.env.VOUCH_CHANNEL_ID;

const COUNTER_FILE = "./vouch_count.json";

function getCount() {
  if (!fs.existsSync(COUNTER_FILE)) fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count: 0 }));
  return JSON.parse(fs.readFileSync(COUNTER_FILE)).count;
}

function incrementCount() {
  const count = getCount() + 1;
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count }));
  return count;
}

function stars(n) {
  return "⭐".repeat(n) + "✩".repeat(5 - n);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`✅ RND Vouch Bot connecté en tant que ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "vouch") {
    await interaction.deferReply({ ephemeral: true });

    const user    = interaction.options.getUser("utilisateur");
    const note    = interaction.options.getInteger("note");
    const message = interaction.options.getString("message");
    const id      = incrementCount();

    const embed = new EmbedBuilder()
      .setColor(0xcc0000)
      .setAuthor({
        name: `@${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTitle("Vouch")
      .setDescription(message)
      .addFields(
        { name: "Rating", value: `${stars(note)} (${note}/5)`, inline: true },
        { name: "Pour",   value: `<@${user.id}>`,             inline: true },
      )
      .setFooter({ text: `Vouch ID: ${id} · RND.SHOP` })
      .setTimestamp();

    try {
      const vouchChannel = await client.channels.fetch(VOUCH_CHANNEL_ID);
      await vouchChannel.send({ embeds: [embed] });
      await interaction.editReply({ content: `✅ Vouch envoyé !` });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `❌ Erreur : ${err.message}` });
    }
  }
});

// Enregistrement des commandes au démarrage
const commands = [
  new SlashCommandBuilder()
    .setName("vouch")
    .setDescription("Laisser un avis sur RND.SHOP")
    .addUserOption(o => o.setName("utilisateur").setDescription("Le vendeur / service").setRequired(true))
    .addIntegerOption(o => o.setName("note").setDescription("Note de 1 à 5").setRequired(true).setMinValue(1).setMaxValue(5))
    .addStringOption(o => o.setName("message").setDescription("Ton avis").setRequired(true))
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("📡 Enregistrement des slash commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Slash commands enregistrées !");
  } catch (err) {
    console.error("Erreur enregistrement commands:", err);
  }
  client.login(TOKEN);
})();
