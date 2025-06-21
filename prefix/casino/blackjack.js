const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  EmbedBuilder,
} = require("discord.js");
const User = require("../../models/user.model.js");
const {
  createNewDeck,
  formatHandForDisplay,
  drawNewCard,
  calculateHandValue,
  isXiDach,
  isXiBan,
  isNguLinh,
  isBust,
} = require("../../helpers/blackjackHelper.js");
const { decBalance, incBalance } = require("../../helpers/userHelper.js");

const PRIMARY_COLOR = "#AA60C8";

module.exports = {
  cooldown: 5000,
  category: 'Casino',
  name: "blackjack", // Tên lệnh
  aliases: ["bj"], // Các biệt danh của lệnh
  description: "Chơi Xì Dách Vietnamese 🃏",
  usage: '<bet>',
  run: async (client, message, args) => {
    // Thay đổi từ execute(interaction) sang run(client, message, args)
    try {
      // Lấy thông tin người chơi cho footer
      const playerUsername = message.author.username;
      const playerAvatarURL = message.author.displayAvatarURL({
        dynamic: true,
      });

      const userData = await User.findOne({ userId: message.author.id }); // Lấy thông tin người dùng từ message.author.id
      if (!userData) {
        const embed = new EmbedBuilder()
          .setColor("#D91656")
          .setDescription(
            `Bạn chưa có tài khoản Casino. Dùng lệnh \`\`\`${client.prefix}start\`\`\` để tạo tài khoản.`
          )
          .setFooter({
            text: `Người gửi: ${playerUsername}`,
            iconURL: playerAvatarURL,
          });
        return await message.channel.send({ embeds: [embed] }); // Trả lời nhanh
      }

      let wager;
      // Kiểm tra nếu args[0] là 'all' (không phân biệt chữ hoa/thường)
      if (args[0] && args[0].toLowerCase() === "all") {
        wager = userData.balance; // Đặt cược tất cả số tiền hiện có
      } else {
        wager = parseInt(args[0]); // Lấy số tiền cược từ đối số đầu tiên
      }

      // Xử lý giới hạn cược nếu số tiền lớn hơn 300,000
      const MAX_WAGER = 300000;
      if (wager > MAX_WAGER) {
        wager = MAX_WAGER;
      }

      // **Phản hồi nhanh chóng với lỗi đầu tiên**
      if (isNaN(wager) || wager <= 0) {
        const embed = new EmbedBuilder()
          .setColor("#D91656")
          .setDescription(`Vui lòng nhập số tiền cược hợp lệ (phải lớn hơn 0).`)
          .setFooter({
            text: `Người gửi: ${playerUsername}`,
            iconURL: playerAvatarURL,
          });
        return await message.channel.send({ embeds: [embed] }); // Trả lời nhanh
      }

      if (wager > userData.balance) {
        const embed = new EmbedBuilder()
          .setColor("#D91656")
          .setDescription(
            `Bạn không đủ tiền để đặt cược. Bạn có: **$${new Intl.NumberFormat(
              "en"
            ).format(userData.balance)}**`
          )
          .setFooter({
            text: `Người gửi: ${playerUsername}`,
            iconURL: playerAvatarURL,
          });
        return await message.channel.send({ embeds: [embed] }); // Trả lời nhanh
      }

      const deckData = await createNewDeck();
      if (!deckData || !deckData.success || deckData.cards.length < 4) {
        console.error("Không đủ bài từ API để bắt đầu ván đấu.");
        return await message.channel.send({
          // Trả lời nhanh
          embeds: [
            new EmbedBuilder()
              .setColor("#D91656")
              .setDescription("Không thể tạo ván đấu. Vui lòng thử lại sau.")
              .setFooter({
                text: `Người gửi: ${playerUsername}`,
                iconURL: playerAvatarURL,
              }),
          ],
          components: [],
        });
      }

      const userID = message.author.id; // Lấy ID người dùng từ message.author.id
      const deckID = deckData.deck_id;
      const dealerHand = [];
      const playerHand = [];

      playerHand.push(deckData.cards[0]);
      dealerHand.push(deckData.cards[1]);
      playerHand.push(deckData.cards[2]);
      dealerHand.push(deckData.cards[3]);

      await decBalance(userID, wager);

      let gameEndedImmediately = false;
      let finalEmbed = new EmbedBuilder().setColor(PRIMARY_COLOR);

      const playerIsXiDach = isXiDach(playerHand);
      const playerIsXiBan = isXiBan(playerHand);
      const dealerIsXiDach = isXiDach(dealerHand);
      const dealerIsXiBan = isXiBan(dealerHand);

      // Tính điểm của người chơi và dealer cho các trường hợp kết thúc ngay lập tức
      const initialPlayerScore = calculateHandValue(playerHand);
      let initialDealerScore = calculateHandValue(dealerHand); // Khởi tạo với let để có thể thay đổi

      // Immediate win/loss conditions - Dealer's hand IS REVEALED
      if (playerIsXiBan && dealerIsXiBan) {
        finalEmbed.setTitle(`🤝 SONG XÌ BÀN! HÒA!`);
        finalEmbed.setColor("#FFEB55"); // Màu vàng cho hòa
        finalEmbed.addFields(
          // Sử dụng addFields

          {
            name: `Bài của Dealer (Điểm: ${initialDealerScore})`,
            value: formatHandForDisplay(dealerHand, false),
            inline: false,
          },

          {
            name: `Bài của Người chơi (Điểm: ${initialPlayerScore})`,
            value: formatHandForDisplay(playerHand, false),
            inline: false,
          }
        );
        // Hoàn tiền cược, vì ban đầu đã trừ wager rồi
        await incBalance(userID, wager); // Hoàn lại tiền cược
        gameEndedImmediately = true;
      }
      // Trường hợp 2: Người chơi Xì Bàn, Dealer không Xì Bàn
      else if (playerIsXiBan) {
        finalEmbed.setTitle(
          `🎉 XÌ BÀN! Bạn thắng lớn! x2.5 số tiền cược (+$${new Intl.NumberFormat(
            "en"
          ).format(2.5 * wager)}). 🎉`
        );
        finalEmbed.setColor("#00FF9C"); // Green for win
        finalEmbed.addFields(
          // Sử dụng addFields

          {
            name: `Bài của Dealer (Điểm: ${initialDealerScore})`,
            value: formatHandForDisplay(dealerHand, false),
            inline: false,
          },

          {
            name: `Bài của Người chơi (Điểm: ${initialPlayerScore})`,
            value: formatHandForDisplay(playerHand, false),
            inline: false,
          }
        );
        await incBalance(userID, wager * 3.5); // (wager gốc đã trừ) + 2.5 * wager = tổng 3.5 * wager
        gameEndedImmediately = true;
      }
      // Trường hợp 3: Dealer Xì Bàn, Người chơi không Xì Bàn (đã xử lý playerIsXiBan ở trên)
      else if (dealerIsXiBan) {
        finalEmbed.setTitle(
          `💔 Dealer XÌ BÀN! Bạn thua (-$${new Intl.NumberFormat("en").format(
            2.5 * wager
          )}).`
        );
        finalEmbed.setColor("#D91656"); // Red for loss
        finalEmbed.addFields(
          // Sử dụng addFields

          {
            name: `Bài của Dealer (Điểm: ${initialDealerScore})`,
            value: formatHandForDisplay(dealerHand, false),
            inline: false,
          },

          {
            name: `Bài của Người chơi (Điểm: ${initialPlayerScore})`,
            value: formatHandForDisplay(playerHand, false),
            inline: false,
          }
        );
        // Tiền cược đã trừ lúc đầu, giờ trừ thêm 1.5x để thành 2.5x
        await decBalance(userID, 1.5 * wager); // Trừ thêm 1.5 lần cược (tổng 2.5 lần)
        gameEndedImmediately = true;
      }
      // Trường hợp 4: Cả hai đều có Xì Dách (sau khi đã kiểm tra Xì Bàn)
      else if (playerIsXiDach && dealerIsXiDach) {
        finalEmbed.setTitle(`🤝 SONG XÌ DÁCH! HÒA!`);
        finalEmbed.setColor("#FFEB55"); // Màu vàng cho hòa
        finalEmbed.addFields(
          // Sử dụng addFields

          {
            name: `Bài của Dealer (Điểm: ${initialDealerScore})`,
            value: formatHandForDisplay(dealerHand, false),
            inline: false,
          },

          {
            name: `Bài của Người chơi (Điểm: ${initialPlayerScore})`,
            value: formatHandForDisplay(playerHand, false),
            inline: false,
          }
        );
        await incBalance(userID, wager); // Hoàn lại tiền cược
        gameEndedImmediately = true;
      }
      // Trường hợp 5: Người chơi Xì Dách, Dealer không Xì Dách (và không Xì Bàn)
      else if (playerIsXiDach) {
        finalEmbed.setTitle(
          `🥳 XÌ DÁCH! Bạn thắng! x1 số tiền cược (+$${new Intl.NumberFormat(
            "en"
          ).format(1 * wager)}). 🎉`
        );
        finalEmbed.setColor("#00FF9C"); // Green for win
        finalEmbed.addFields(
          // Sử dụng addFields

          {
            name: `Bài của Dealer (Điểm: ${initialDealerScore})`,
            value: formatHandForDisplay(dealerHand, false),
            inline: false,
          },

          {
            name: `Bài của Người chơi (Điểm: ${initialPlayerScore})`,
            value: formatHandForDisplay(playerHand, false),
            inline: false,
          }
        );
        await incBalance(userID, wager * 2);
        gameEndedImmediately = true;
      }
      // Trường hợp 6: Dealer Xì Dách, Người chơi không Xì Dách (và không Xì Bàn)
      else if (dealerIsXiDach) {
        finalEmbed.setTitle(
          `😭 Dealer XÌ DÁCH! Bạn thua (-$${new Intl.NumberFormat("en").format(
            1 * wager
          )}).`
        );
        finalEmbed.setColor("#D91656"); // Red for loss
        finalEmbed.addFields(
          // Sử dụng addFields

          {
            name: `Bài của Dealer (Điểm: ${initialDealerScore})`,
            value: formatHandForDisplay(dealerHand, false),
            inline: false,
          },

          {
            name: `Bài của Người chơi (Điểm: ${initialPlayerScore})`,
            value: formatHandForDisplay(playerHand, false),
            inline: false,
          }
        );
        gameEndedImmediately = true;
      }

      if (gameEndedImmediately) {
        finalEmbed.setFooter({
          text: `Người gửi: ${playerUsername}`,
          iconURL: playerAvatarURL,
        }); // Thêm footer trước khi gửi
        return await message.channel.send({
          embeds: [finalEmbed],
          components: [],
        }); // Trả lời nhanh
      }

      // --- Nếu không có Xì Dách/Xì Bàn ngay lập tức, bắt đầu game bình thường ---
      let playerCurrentScore = calculateHandValue(playerHand);

      let gameEmbed = new EmbedBuilder()
        .setColor(PRIMARY_COLOR)
        .setTitle("Xì dách Vietnamese 🃏")
        .setDescription(
          `Số tiền cược: **$${new Intl.NumberFormat("en").format(wager)}**`
        )
        .addFields(
          // Dealer's hand completely hidden during player's turn
          { name: "Bài của Dealer", value: "<:backside:1383700179324244039>  <:backside:1383700179324244039>", inline: false },
          {
            name: `Bài của Người chơi (Điểm: ${playerCurrentScore})`,
            value: formatHandForDisplay(playerHand, false),
            inline: false,
          }
        )
        .setFooter({
          text: `Người gửi: ${playerUsername}`,
          iconURL: playerAvatarURL,
        }); // Thêm footer

      const hitButton = new ButtonBuilder()
        .setCustomId("HIT")
        .setLabel("⤴️ RÚT")
        .setStyle(ButtonStyle.Primary);

      const standButton = new ButtonBuilder()
        .setCustomId("STAND")
        .setLabel("⛔ DỪNG")
        .setStyle(ButtonStyle.Success);

      const buttonRow = new ActionRowBuilder().addComponents([
        hitButton,
        standButton,
      ]);

      // Gửi tin nhắn ban đầu và lưu trữ nó để edit sau
      const response = await message.channel.send({
        // <-- Thay đổi ở đây
        embeds: [gameEmbed],
        components: [buttonRow],
        fetchReply: true, // Quan trọng để lấy message object cho collector
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000, // 60 giây để phản hồi
        filter: (i) => i.user.id === userID, // Chỉ người chơi ban đầu mới có thể tương tác
      });

      collector.on("collect", async (i) => {
        await i.deferUpdate(); // Defer the button interaction

        let currentEmbed = new EmbedBuilder()
          .setColor(gameEmbed.color || PRIMARY_COLOR)
          .setTitle(gameEmbed.data.title || "Xì dách Vietnamese 🃏")
          .setDescription(
            `Số tiền cược: **$${new Intl.NumberFormat("en").format(wager)}**`
          )
          .setFooter({
            text: `Người gửi: ${playerUsername}`,
            iconURL: playerAvatarURL,
          }); // Thêm footer vào mỗi lần cập nhật embed

        // Cập nhật điểm người chơi trước khi tạo fields mới
        playerCurrentScore = calculateHandValue(playerHand); // Lấy điểm người chơi trước khi cập nhật fields

        if (i.customId === "HIT") {
          const newCard = await drawNewCard(deckID);
          playerHand.push(newCard);
          playerCurrentScore = calculateHandValue(playerHand); // Cập nhật điểm sau khi rút

          // Cập nhật fields của embed mới với điểm số
          currentEmbed.addFields(
            { name: "Bài của Dealer", value: "<:backside:1383700179324244039>  <:backside:1383700179324244039>", inline: false }, // Vẫn ẩn bài Dealer
            {
              name: `Bài của Người chơi (Điểm: ${playerCurrentScore})`,
              value: formatHandForDisplay(playerHand, false),
              inline: false,
            }
          );

          if (isNguLinh(playerHand)) {
            // Người chơi Ngũ Linh, Dealer phải rút bài đến khi đạt 17 hoặc quắc
            let dealerScoreAtNguLinh = calculateHandValue(dealerHand);
            while (dealerScoreAtNguLinh < 17 && !isBust(dealerHand)  && dealerHand.length <= 5) {
              // Thêm điều kiện !isBust(dealerHand) để tránh vòng lặp vô hạn nếu Dealer luôn < 17
              const newCardDealer = await drawNewCard(deckID);
              dealerHand.push(newCardDealer);
              dealerScoreAtNguLinh = calculateHandValue(dealerHand);
            }

            const dealerIsNguLinh = isNguLinh(dealerHand);

            if (dealerIsNguLinh) {
              // CẢ HAI ĐỀU NGŨ LINH
              let finalMessage = "";
              let playerWon = false;

              // So sánh điểm Ngũ Linh: ai nhỏ hơn thắng
              if (playerCurrentScore < dealerScoreAtNguLinh) {
                finalMessage = `🎉 SONG LINH! Bạn thắng với Ngũ Linh điểm thấp hơn (${playerCurrentScore} < ${dealerScoreAtNguLinh})! x2 số tiền cược (+$${new Intl.NumberFormat(
                  "en"
                ).format(2 * wager)}). 🎉`;
                currentEmbed.setColor("#00FF9C"); // Màu xanh lá cho thắng
                await incBalance(userID, wager * 3); // Ngũ Linh thường thắng x2 tiền cược gốc (tổng 3 lần cược)
                playerWon = true;
              } else if (playerCurrentScore > dealerScoreAtNguLinh) {
                finalMessage = `💔 SONG LINH! Bạn thua với Ngũ Linh điểm cao hơn (${playerCurrentScore} > ${dealerScoreAtNguLinh}) (-$${new Intl.NumberFormat(
                  "en"
                ).format(wager)}).`;
                currentEmbed.setColor("#D91656"); // Màu đỏ cho thua
                playerWon = false;
              } else {
                // Bằng điểm
                finalMessage = `🤝 SONG LINH! Cả hai Ngũ Linh cùng điểm (${playerCurrentScore})! HÒA.`;
                currentEmbed.setColor("#FFEB55"); // Màu vàng cho hòa
                await incBalance(userID, wager); // Hoàn tiền cược
                playerWon = false;
              }
              currentEmbed.setTitle(finalMessage);
            } else {
              // CHỈ NGƯỜI CHƠI NGŨ LINH, DEALER KHÔNG NGŨ LINH
              currentEmbed.setTitle(
                `🎉 NGŨ LINH! Bạn thắng! x2 số tiền cược (+$${new Intl.NumberFormat(
                  "en"
                ).format(2 * wager)}). 🎉`
              );
              currentEmbed.setColor("#00FF9C"); // Màu xanh lá cho thắng
              await incBalance(userID, wager * 3); // Ngũ Linh thường thắng x2 tiền cược gốc (tổng 3 lần cược)
            }

            // Hiển thị bài và điểm của Dealer khi game kết thúc
            currentEmbed.data.fields[0].value = formatHandForDisplay(
              dealerHand,
              false
            );
            currentEmbed.data.fields[0].name = `Bài của Dealer (Điểm: ${dealerScoreAtNguLinh})`;
            await response.edit({ embeds: [currentEmbed], components: [] }); // <-- Thay đổi ở đây
            collector.stop();
            return;
          } else if (isBust(playerHand)) {
            // Người chơi quắc
            // Dealer phải rút đến 17/quắc (luật Xì Dách Việt Nam)
            let dealerScoreAtBust = calculateHandValue(dealerHand);
            while (dealerScoreAtBust < 17 && dealerHand.length <= 5) {
              const newCardDealer = await drawNewCard(deckID);
              dealerHand.push(newCardDealer);
              dealerScoreAtBust = calculateHandValue(dealerHand);
            }

            let finalMessage = "";
            // Nếu người chơi quắc, kiểm tra Dealer
            if (isBust(dealerHand)) {
              finalMessage = "🤝 HÒA! Cả hai cùng quắc!";
              currentEmbed.setColor("#FFEB55"); // Màu vàng cho hòa
              await incBalance(userID, wager); // Người chơi được hoàn tiền cược
            } else {
              finalMessage = `💔 QUẮC! Bạn thua (-$${new Intl.NumberFormat(
                "en"
              ).format(wager)}).`;
              currentEmbed.setColor("#D91656"); // Màu đỏ cho thua
              // Tiền cược đã bị trừ trước đó, không làm gì thêm nếu thua
            }
            currentEmbed.setTitle(finalMessage);

            currentEmbed.data.fields[0].value = formatHandForDisplay(
              dealerHand,
              false
            );
            currentEmbed.data.fields[0].name = `Bài của Dealer (Điểm: ${dealerScoreAtBust})`;

            await response.edit({ embeds: [currentEmbed], components: [] }); // <-- Thay đổi ở đây
            collector.stop();
            return;
          }

          await response.edit({
            embeds: [currentEmbed],
            components: [buttonRow],
          }); // <-- Thay đổi ở đây
        } else if (i.customId === "STAND") {
          // Cập nhật điểm người chơi lần cuối trước khi dealer rút bài
          playerCurrentScore = calculateHandValue(playerHand);

          let finalMessage = "";
          let playerWon = false;
          let dealerFinalScore = calculateHandValue(dealerHand); // Điểm ban đầu của Dealer

          // --- LUẬT MỚI: Nếu người chơi DỪNG và điểm < 16, người chơi thua ngay lập tức ---
          if (playerCurrentScore < 16) {
            finalMessage = `🥲 BẠN THUA! Số điểm thấp hơn 16 (-$${new Intl.NumberFormat(
              "en"
            ).format(wager)}).`;
            currentEmbed.setColor("#D91656");
            playerWon = false; // Người chơi thua

            // KHÔNG CẦN DEALER RÚT BÀI TRONG TRƯỜNG HỢP NÀY
            // Dealer vẫn hiển thị bài của mình để người chơi biết
            currentEmbed.addFields(
              {
                name: `Bài của Dealer (Điểm: ${dealerFinalScore})`,
                value: formatHandForDisplay(dealerHand, false),
                inline: false,
              },
              {
                name: `Bài của Người chơi (Điểm: ${playerCurrentScore})`,
                value: formatHandForDisplay(playerHand, false),
                inline: false,
              }
            );
          } else {
            // --- Các trường hợp còn lại (người chơi >= 16) ---
            let dealerScore = calculateHandValue(dealerHand);
            while (dealerScore < 17  && dealerHand.length <= 5) {
              const newCard = await drawNewCard(deckID);
              dealerHand.push(newCard);
              dealerScore = calculateHandValue(dealerHand);
            }

            dealerFinalScore = calculateHandValue(dealerHand); // Điểm cuối cùng của Dealer sau khi rút

            // Tạo fields mới cho embed cuối cùng, hiện đầy đủ bài và điểm Dealer
            currentEmbed.addFields(
              {
                name: `Bài của Dealer (Điểm: ${dealerFinalScore})`,
                value: formatHandForDisplay(dealerHand, false),
                inline: false,
              },
              {
                name: `Bài của Người chơi (Điểm: ${playerCurrentScore})`,
                value: formatHandForDisplay(playerHand, false),
                inline: false,
              }
            );

            if (isNguLinh(dealerHand)) {
              finalMessage = `🎉 DEALER NGŨ LINH! Bạn thua! (-$${new Intl.NumberFormat(
                "en"
              ).format(2 * wager)}).`;
              currentEmbed.setColor("#D91656");
              playerWon = false;
              decBalance(userID, wager);
            } else if (isBust(dealerHand)) {
              finalMessage = `🎉 DEALER QUẮC! Bạn thắng! x1 số tiền cược (+$${new Intl.NumberFormat(
                "en"
              ).format(1 * wager)}).`;
              currentEmbed.setColor("#00FF9C");
              playerWon = true;
            } else if (playerCurrentScore > dealerFinalScore) {
              finalMessage = `🥳 BẠN THẮNG! x1 số tiền cược (+$${new Intl.NumberFormat(
                "en"
              ).format(1 * wager)}).`;
              currentEmbed.setColor("#00FF9C");
              playerWon = true;
            } else if (playerCurrentScore < dealerFinalScore) {
              finalMessage = `😭 BẠN THUA! (-$${new Intl.NumberFormat(
                "en"
              ).format(wager)}).`;
              // Giữ nguyên thông báo "Dằn dơ" nếu điểm là 16 hoặc 17
              if (playerCurrentScore === 16 || playerCurrentScore === 17) {
                if (playerHand.length === 2 && playerCurrentScore === 16)
                  finalMessage = `😭 BẠN THUA! Dằn dơ hả mài (-$${new Intl.NumberFormat(
                    "en"
                  ).format(wager)})`;
                else
                  finalMessage = `😭 BẠN THUA! Rút nữa đi má (-$${new Intl.NumberFormat(
                    "en"
                  ).format(wager)})`;
              }
              currentEmbed.setColor("#D91656");
              playerWon = false;
            } else {
              // Hòa
              finalMessage = "🤝 HÒA!";
              currentEmbed.setColor("#FFEB55"); // Màu vàng cho hòa
              playerWon = false;
              await incBalance(userID, wager); // Hoàn tiền cược cho hòa
            }
          } // Kết thúc else (playerCurrentScore >= 16)

          currentEmbed.setTitle(finalMessage);

          if (playerWon) {
            await incBalance(userID, wager * 2); // Thắng thì nhận lại gốc + thêm 1 lần cược = tổng 2 lần cược
          }

          await response.edit({ embeds: [currentEmbed], components: [] });
          collector.stop();
          return;
        }
      });

      collector.on("end", async (collected, reason) => {
        if (reason === "time" && collected.size === 0) {
          // Người chơi không tương tác, tiền cược đã bị trừ
          // Dealer vẫn rút bài để hoàn thiện ván đấu hiển thị
          let finalDealerScore = calculateHandValue(dealerHand);
          while (finalDealerScore < 17  && dealerHand.length <= 5) {
            const newCardDealer = await drawNewCard(deckID);
            dealerHand.push(newCardDealer);
            finalDealerScore = calculateHandValue(dealerHand);
          }

          const finalPlayerScore = calculateHandValue(playerHand);

          const timeoutEmbed = new EmbedBuilder()
            .setTitle("⏱️ Hết giờ! Ván đấu kết thúc.")
            .setDescription("Bạn không tương tác kịp. Tiền cược bị mất.")
            .addFields(
              {
                name: `Bài của Dealer (Điểm: ${finalDealerScore})`,
                value: formatHandForDisplay(dealerHand, false),
                inline: false,
              },
              {
                name: `Bài của Người chơi (Điểm: ${finalPlayerScore})`,
                value: formatHandForDisplay(playerHand, false),
                inline: false,
              }
            )
            .setColor("#F0EBE3") // Màu xám cho hết giờ
            .setFooter({
              text: `Người gửi: ${playerUsername}`,
              iconURL: playerAvatarURL,
            });
          await response.edit({ embeds: [timeoutEmbed], components: [] }); // <-- Thay đổi ở đây
          console.log(`Ván đấu của ${userID} kết thúc do hết thời gian.`);
        }
      });
    } catch (error) {
      console.error("Có lỗi ở blackjack command (prefix):", error);
      const playerUsername = message.author.username;
      const playerAvatarURL = message.author.displayAvatarURL({
        dynamic: true,
      });

      const errorEmbed = new EmbedBuilder()
        .setColor("#D91656")
        .setDescription("Có lỗi xảy ra. Vui lòng liên hệ với admin.")
        .setFooter({
          text: `Người gửi: ${playerUsername}`,
          iconURL: playerAvatarURL,
        });
      await message.channel.send({ embeds: [errorEmbed] }); // <-- Thay đổi ở đây
    }
  },
};
