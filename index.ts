import type { ChatInputCommandInteraction } from "discord.js";
import type { SlashCommandBuilder } from "@discordjs/builders";
import { createSlashCommand } from "@essence-discord-bot/api/botExtension";
import chalk from "chalk";

const workerURL = new URL("worker.ts", import.meta.url).href;

export function discordBotInit() {
  const rollSlashCommandHandler = (slashCommand: SlashCommandBuilder) => {
    slashCommand
      .setName("roll")
      .setDescription("Rolls dice")
      .addStringOption((option) =>
        option
          .setName("roll")
          .setDescription("Type standard roll command")
          .setRequired(true)
      )
      .addBooleanOption((option) =>
        option.setName("sort").setDescription("Sort output").setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("comment")
          .setDescription("Comment for the roll")
          .setRequired(false)
      );
  };

  const rollAltSlashCommandHandler = (slashCommand: SlashCommandBuilder) => {
    slashCommand
      .setName("r")
      .setDescription("Rolls dice")
      .addStringOption((option) =>
        option
          .setName("roll")
          .setDescription("Type standard roll command")
          .setRequired(true)
      )
      .addBooleanOption((option) =>
        option.setName("sort").setDescription("Sort output").setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("comment")
          .setDescription("Comment for the roll")
          .setRequired(false)
      );
  };

  try {
    const rollInteractionHandler = async (
      interaction: ChatInputCommandInteraction
    ) => {
      await interaction.deferReply();
      const rollInput = interaction.options.get("roll")?.value as string;
      const sort = interaction.options.get("sort")?.value as boolean;
      const comment = interaction.options.get("comment")?.value as string;

      const worker = new Worker(workerURL);
      worker.postMessage({ rollInput, sort });
      worker.addEventListener("message", async (event) => {
        if (
          !event.data ||
          event.data.status === "error" ||
          typeof event.data.result === "string"
        ) {
          await interaction.editReply({ content: event.data.result as string });
          return;
        }
        const formattedResult = formatRollCommand(
          event.data.result,
          rollInput,
          interaction.user.id,
          comment
        );
        await interaction.editReply({ content: formattedResult });
      });
    };
    createSlashCommand(rollSlashCommandHandler, rollInteractionHandler);
    createSlashCommand(rollAltSlashCommandHandler, rollInteractionHandler);
  } catch (error) {
    console.error(error);
  }

  const coinflipSlashCommandHandler = (slashCommand: SlashCommandBuilder) => {
    slashCommand.setName("coinflip").setDescription("Flips a coin");
  };
  const coinflipInteractionHandler = async (
    interaction: ChatInputCommandInteraction
  ) => {
    await interaction.deferReply();
    const result = Math.random() > 0.5 ? "Heads" : "Tails";
    await interaction.editReply(result);
  };
  createSlashCommand(coinflipSlashCommandHandler, coinflipInteractionHandler);
  console.log(
    `${chalk.green(
      "[Dice Roller Module]"
    )} Registered 3 slash commands: [roll, r, coinflip]`
  );
}

function formatRollCommand(
  processingResult: { sum: number[]; output: string[] },
  rollInput: string,
  user: string,
  comment: string
) {
  if (processingResult.sum.length !== processingResult.output.length) {
    return "There was an error while processing your roll";
  }
  let result = `<@${user}> **${rollInput}**`;
  if (comment) {
    result += ` - ${comment}`;
  }
  result += "\n";
  for (let i = 0; i < processingResult.sum.length; i++) {
    result +=
      "`" +
      processingResult.sum[i] +
      "` ⟵ " +
      processingResult.output[i] +
      "\n";
  }
  if (result.length > 1900) {
    return "The output is too long to be displayed";
  }
  return result;
}
