const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, EmbedBuilder } = require("discord.js");
const User = require('../../models/user.model.js');
const { 
    createNewDeck, 
    formatHandForDisplay, 
    drawNewCard, 
    calculateHandValue, // Đảm bảo import hàm này
    isXiDach, 
    isXiBan, 
    isNguLinh, 
    isBust 
} = require('../../helpers/blackjackHelper.js');
const { decBalance, incBalance } = require('../../helpers/userHelper.js'); 
const {prefix} = require('../../config.json')
const PRIMARY_COLOR = '#AA60C8'; 

module.exports = {
    cooldown: 5,
    category: 'Casino',
    data: new SlashCommandBuilder()
        .setName('black-jack')
        .setDescription('Chơi xì dách nha bro')
        .addIntegerOption(option => 
            option
                .setName('bet')
                .setDescription('Số tiền đặt cược')
                .setMinValue(1)
                .setRequired(true)
        ),
        async execute(interaction) {
            // try {
            //     await interaction.deferReply();

            //     const wager = interaction.options.getInteger('bet');
            //     const userData = await User.findOne({userId: interaction.user.id});

            //     // Lấy thông tin người chơi cho footer
            //     const playerUsername = interaction.user.username;
            //     const playerAvatarURL = interaction.user.displayAvatarURL({ dynamic: true });
            //     if (!userData) {
            //         const embed = new EmbedBuilder()
            //             .setColor("#D91656")
            //             .setDescription(`Bạn chưa có tài khoản Casino. Dùng lệnh /start để tạo tài khoản.`);
            //         return await interaction.editReply({embeds: [embed]}); 
            //     }
            //     if (wager > userData.balance) {
            //         const embed = new EmbedBuilder()
            //             .setColor("#D91656")
            //             .setDescription(`Bạn không đủ tiền để đặt cược. Bạn có: **$${new Intl.NumberFormat("en").format(userData.balance)}**`);
            //         return await interaction.editReply({embeds: [embed]}); 
            //     }
            //     if (wager <= 0) {
            //         const embed = new EmbedBuilder()
            //             .setColor("#D91656")
            //             .setDescription(`Số tiền cược phải lớn hơn 0.`);
            //         return await interaction.editReply({embeds: [embed]}); 
            //     }

            //     const deckData = await createNewDeck(); 
            //     if (!deckData || !deckData.success || deckData.cards.length < 4) {
            //         console.error('Không đủ bài từ API để bắt đầu ván đấu.');
            //         return await interaction.editReply({ 
            //             embeds: [new EmbedBuilder().setColor("#D91656").setDescription("Không thể tạo ván đấu. Vui lòng thử lại sau.")],
            //             components: []
            //         });
            //     }

            //     const userID = interaction.user.id;
            //     const deckID = deckData.deck_id;
            //     const dealerHand = [];
            //     const playerHand = [];

            //     playerHand.push(deckData.cards[0]);
            //     dealerHand.push(deckData.cards[1]);
            //     playerHand.push(deckData.cards[2]);
            //     dealerHand.push(deckData.cards[3]);
                
            //     await decBalance(userID, wager);

            //     let gameEndedImmediately = false;
            //     let finalEmbed = new EmbedBuilder().setColor(PRIMARY_COLOR);

            //     const playerIsXiDach = isXiDach(playerHand);
            //     const playerIsXiBan = isXiBan(playerHand);
            //     const dealerIsXiDach = isXiDach(dealerHand);
            //     const dealerIsXiBan = isXiBan(dealerHand);

            //     // Tính điểm của người chơi và dealer cho các trường hợp kết thúc ngay lập tức
            //     const initialPlayerScore = calculateHandValue(playerHand);
            //     const initialDealerScore = calculateHandValue(dealerHand);

            //     if (playerIsXiBan) {
            //         finalEmbed.setTitle('🎉 XÌ BÀN! Bạn thắng lớn! x2.5 số tiền cược. 🎉');
            //         finalEmbed.addFields( // Sử dụng addFields
            //             { name: `Bài của Dealer (Điểm: ${initialDealerScore})`, value: formatHandForDisplay(dealerHand, false), inline: false },
            //             { name: `Bài của Người chơi (Điểm: ${initialPlayerScore})`, value: formatHandForDisplay(playerHand, false), inline: false }
            //         );
            //         finalEmbed.setColor("#00FF9C"); // Green for win
            //         await incBalance(userID, wager * 2.5); 
            //         gameEndedImmediately = true;
            //     } else if (playerIsXiDach) {
            //         finalEmbed.setTitle('🥳 XÌ DÁCH! Bạn thắng! x2 số tiền cược. 🎉');
            //         finalEmbed.addFields( // Sử dụng addFields
            //             { name: `Bài của Dealer (Điểm: ${initialDealerScore})`, value: formatHandForDisplay(dealerHand, false), inline: false },
            //             { name: `Bài của Người chơi (Điểm: ${initialPlayerScore})`, value: formatHandForDisplay(playerHand, false), inline: false }
            //         );
            //         finalEmbed.setColor("#00FF9C"); // Green for win
            //         await incBalance(userID, wager * 2); 
            //         gameEndedImmediately = true;
            //     } else if (dealerIsXiBan) {
            //         finalEmbed.setTitle('💔 Dealer XÌ BÀN! Bạn thua.');
            //         finalEmbed.addFields( // Sử dụng addFields
            //             { name: `Bài của Dealer (Điểm: ${initialDealerScore})`, value: formatHandForDisplay(dealerHand, false), inline: false },
            //             { name: `Bài của Người chơi (Điểm: ${initialPlayerScore})`, value: formatHandForDisplay(playerHand, false), inline: false }
            //         );
            //         finalEmbed.setColor("#D91656"); // Red for loss
            //         gameEndedImmediately = true;
            //     } else if (dealerIsXiDach) {
            //         finalEmbed.setTitle('😭 Dealer XÌ DÁCH! Bạn thua.');
            //         finalEmbed.addFields( // Sử dụng addFields
            //             { name: `Bài của Dealer (Điểm: ${initialDealerScore})`, value: formatHandForDisplay(dealerHand, false), inline: false },
            //             { name: `Bài của Người chơi (Điểm: ${initialPlayerScore})`, value: formatHandForDisplay(playerHand, false), inline: false }
            //         );
            //         finalEmbed.setColor("#D91656"); // Red for loss
            //         gameEndedImmediately = true;
            //     }

            //     if (gameEndedImmediately) {
            //         return await interaction.editReply({ embeds: [finalEmbed], components: [] });
            //     }

            //     // --- Nếu không có Xì Dách/Xì Bàn ngay lập tức, bắt đầu game bình thường ---
            //     // Tính điểm hiện tại của người chơi để hiển thị ban đầu
            //     let playerCurrentScore = calculateHandValue(playerHand);

            //     let gameEmbed = new EmbedBuilder()
            //         .setColor(PRIMARY_COLOR)
            //         .setTitle('Xì dách Vietnamese 🃏')
            //         .addFields(
            //             { name: 'Bài của Dealer', value: '```?? ??```', inline: false }, 
            //             { name: `Bài của Người chơi (Điểm: ${playerCurrentScore})`, value: formatHandForDisplay(playerHand, false), inline: false }
            //         )
            //         .setFooter({ text: `Người chơi: ${playerUsername}`, iconURL: playerAvatarURL });;

            //     const hitButton = new ButtonBuilder()
            //         .setCustomId('HIT')
            //         .setLabel('⤴️ RÚT')
            //         .setStyle(ButtonStyle.Primary);
                
            //     const standButton = new ButtonBuilder()
            //         .setCustomId('STAND')
            //         .setLabel('⛔ DỪNG')
            //         .setStyle(ButtonStyle.Success);

            //     const buttonRow = new ActionRowBuilder().addComponents([hitButton, standButton]);

            //     const response = await interaction.editReply({
            //         embeds: [gameEmbed],
            //         components: [buttonRow],
            //         fetchReply: true,
            //     });

            //     const collector = response.createMessageComponentCollector({ 
            //         componentType: ComponentType.Button, 
            //         time: 60000, 
            //         filter: i => i.user.id === userID 
            //     });

            //     collector.on('collect', async i => {
            //         await i.deferUpdate();

            //         // Tạo một bản sao của EmbedBuilder hoặc tạo lại hoàn toàn để cập nhật
            //         let currentEmbed = new EmbedBuilder()
            //             .setColor(gameEmbed.color || PRIMARY_COLOR) 
            //             .setTitle(gameEmbed.data.title || 'Xì dách Vietnamese 🃏')
            //             .setFooter({ text: `Người chơi: ${playerUsername}`, iconURL: playerAvatarURL });;
                    
            //         // Cập nhật điểm người chơi trước khi tạo fields mới
            //         playerCurrentScore = calculateHandValue(playerHand); // Lấy điểm người chơi trước khi cập nhật fields

            //         if (i.customId === 'HIT') {
            //             const newCard = await drawNewCard(deckID); 
            //             playerHand.push(newCard);
            //             playerCurrentScore = calculateHandValue(playerHand); // Cập nhật điểm sau khi rút
                        
            //             // Cập nhật fields của embed mới với điểm số
            //             currentEmbed.addFields(
            //                 { name: 'Bài của Dealer', value: '```?? ??```', inline: false }, // Vẫn ẩn bài Dealer
            //                 { name: `Bài của Người chơi (Điểm: ${playerCurrentScore})`, value: formatHandForDisplay(playerHand, false), inline: false }
            //             );

            //             if (isNguLinh(playerHand)) {
            //                 currentEmbed.setTitle('🎉 NGŨ LINH! Bạn thắng! x2 số tiền cược. 🎉');
            //                 // Hiển thị bài và điểm của Dealer khi game kết thúc
            //                 currentEmbed.data.fields[0].value = formatHandForDisplay(dealerHand, false); 
            //                 currentEmbed.data.fields[0].name = `Bài của Dealer (Điểm: ${calculateHandValue(dealerHand)})`;
            //                 currentEmbed.setColor("#00FF9C");
            //                 await incBalance(userID, wager * 3); 
            //                 await i.editReply({ embeds: [currentEmbed], components: [] });
            //                 collector.stop(); 
            //                 return; 
            //             } else if (isBust(playerHand)) {
            //                 let dealerScoreAtBust = calculateHandValue(dealerHand);
            //                 while (dealerScoreAtBust < 17 && dealerHand.length <= 5) {
            //                     const newCardDealer = await drawNewCard(deckID);
            //                     dealerHand.push(newCardDealer);
            //                     dealerScoreAtBust = calculateHandValue(dealerHand);
            //                 }

            //                 let finalMessage = '';
            //                 let playerResult = 'loss';

            //                 if (isBust(dealerHand)) {
            //                     finalMessage = '🤝 HÒA! Cả hai cùng quắc!';
            //                     currentEmbed.setColor("#FFEB55");
            //                     await incBalance(userID, wager);
            //                     playerResult = 'draw';
            //                 } else {
            //                     finalMessage = '💔 QUẮC! Bạn thua.';
            //                     currentEmbed.setColor("#D91656");
            //                     playerResult = 'loss';
            //                 }
            //                 currentEmbed.setTitle(finalMessage);

            //                 currentEmbed.data.fields[0].value = formatHandForDisplay(dealerHand, false); 
            //                 currentEmbed.data.fields[0].name = `Bài của Dealer (Điểm: ${dealerScoreAtBust})`;
            //                 currentEmbed.setColor("#D91656");
            //                 await i.editReply({ embeds: [currentEmbed], components: [] });
            //                 collector.stop(); 
            //                 return; 
            //             } 
                        
            //             await i.editReply({ embeds: [currentEmbed], components: [buttonRow] });

            //         } else if (i.customId === 'STAND') { 
            //             // Cập nhật điểm người chơi lần cuối trước khi dealer rút bài
            //             playerCurrentScore = calculateHandValue(playerHand); 

            //             let dealerScore = calculateHandValue(dealerHand);
            //             while (dealerScore < 17  && dealerHand.length <= 5) {
            //                 const newCard = await drawNewCard(deckID); 
            //                 dealerHand.push(newCard);
            //                 dealerScore = calculateHandValue(dealerHand);
            //             }

            //             const dealerFinalScore = calculateHandValue(dealerHand); // Điểm cuối cùng của Dealer

            //             // Tạo fields mới cho embed cuối cùng, hiện đầy đủ bài và điểm Dealer
            //             currentEmbed.addFields(
            //                 { name: `Bài của Dealer (Điểm: ${dealerFinalScore})`, value: formatHandForDisplay(dealerHand, false), inline: false }, 
            //                 { name: `Bài của Người chơi (Điểm: ${playerCurrentScore})`, value: formatHandForDisplay(playerHand, false), inline: false }
            //             );

            //             let finalMessage = '';
            //             let playerWon = false;

            //             if (isBust(dealerHand)) {
            //                 finalMessage = '🎉 DEALER QUẮC! Bạn thắng! x1 số tiền cược.';
            //                 currentEmbed.setColor("#00FF9C");
            //                 playerWon = true;
            //             } else if (playerCurrentScore > dealerFinalScore) { // So sánh với điểm cuối cùng của dealer
            //                 finalMessage = '🥳 BẠN THẮNG! x1 số tiền cược.';
            //                 currentEmbed.setColor("#00FF9C");
            //                 playerWon = true;
            //             } else if (playerCurrentScore < dealerFinalScore) { // So sánh với điểm cuối cùng của dealer
            //                 finalMessage = '😭 BẠN THUA!';
            //                 currentEmbed.setColor("#D91656");
            //                 playerWon = false;
            //             } else {
            //                 finalMessage = '🤝 HÒA!'; 
            //                 currentEmbed.setColor("#FFEB55");
            //                 playerWon = false;
            //                 await incBalance(userID, wager);
            //             }

            //             currentEmbed.setTitle(finalMessage);
                        
            //             if (playerWon) {
            //                 await incBalance(userID, wager * 2); 
            //             } 

            //             await i.editReply({ embeds: [currentEmbed], components: [] }); 
            //             collector.stop();
            //             return; 
            //         }
            //     });

            //     collector.on('end', async (collected, reason) => {
            //         if (reason === 'time' && collected.size === 0) {
            //             // Tính điểm cuối cùng của người chơi và dealer khi hết giờ
            //             const finalPlayerScore = calculateHandValue(playerHand);
            //             const finalDealerScore = calculateHandValue(dealerHand);

            //             const timeoutEmbed = new EmbedBuilder()
            //                 .setTitle('⏱️ Hết giờ! Ván đấu kết thúc.')
            //                 .setDescription('Bạn không tương tác hoặc bị treo. Tiền cược bị mất.')
            //                 .addFields(
            //                     { name: `Bài của Dealer (Điểm: ${finalDealerScore})`, value: formatHandForDisplay(dealerHand, false), inline: false }, 
            //                     { name: `Bài của Người chơi (Điểm: ${finalPlayerScore})`, value: formatHandForDisplay(playerHand, false), inline: false }
            //                 )
            //                 .setColor("#F0EBE3")
            //                 .setFooter({ text: `Người chơi: ${playerUsername}`, iconURL: playerAvatarURL }); 
            //             await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
            //             console.log(`Ván đấu của ${userID} kết thúc do hết thời gian.`);
            //         }
            //     });

            // } catch (error) {
            //     console.error('Có lỗi ở blackjack command:', error); 
            //     if (interaction.deferred || interaction.replied) {
            //         const errorEmbed = new EmbedBuilder()
            //             .setColor("Red")
            //             .setDescription('Có lỗi xảy ra. Vui lòng liên hệ với admin.')
            //             .setFooter({ text: `Người chơi: ${playerUsername}`, iconURL: playerAvatarURL }); // Thêm footer
            //         await interaction.editReply({ embeds: [errorEmbed] });
            //     } else {
            //         const errorEmbed = new EmbedBuilder()
            //             .setColor("Red")
            //             .setDescription('Có lỗi xảy ra. Vui lòng liên hệ với admin.')
            //             .setFooter({ text: `Người chơi: ${playerUsername}`, iconURL: playerAvatarURL }); // Thêm footer
            //         await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            //     }
            // }
            return await interaction.reply({content: `Vui lòng dùng lệnh \`${prefix}blackjack <bet>\` thay cho lệnh này.`})
        }
};