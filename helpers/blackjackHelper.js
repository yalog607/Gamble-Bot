// helpers/blackjackHelper.js
const axios = require('axios');
const API_URL = 'https://deckofcardsapi.com/api/deck';
const { deckOfCards } = require('./deckOfCardsHelper');

const SUITS = {
    'SPADES': '♠️',
    'HEARTS': '♥️',
    'DIAMONDS': '♦️',
    'CLUBS': '♣️'
};

// Định nghĩa giá trị số của các lá bài
const CARD_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, // '10' for 10
    'JACK': 10, 'QUEEN': 10, 'KING': 10,
    'ACE': 11 // Át ban đầu là 11, sẽ xử lý thành 1 nếu tổng vượt 21
};

async function createNewDeck() {
    // Rút 4 lá ban đầu (2 cho dealer, 2 cho player)
    const deckData = (await axios.get(`${API_URL}/new/draw/?count=4`)).data;
    if (!deckData || !deckData.success) {
        throw new Error('Lỗi: Không thể tạo bộ bài mới');
    }
    return deckData; // Trả về đối tượng deckData gốc từ API
}

// Hàm này trả về giá trị bài dạng chuỗi để hiển thị (ví dụ: "A♠️", "10♥️")
function formatCardValueToString(cardObject) { // Đổi tên tham số để rõ ràng là nhận object
    // API trả về '10' dưới dạng '10', J/Q/K/A là tên đầy đủ
    // const value = cardObject.code.toLowerCase();
    const value = cardObject.value === '10' ? '10' : cardObject.value[0];
    // return `<:${value}:${deckOfCards[value]}>`;
    return `${value}${SUITS[cardObject.suit]}`;
}


// Hàm này dùng để tính điểm của một bộ bài
// Bây giờ hàm này nhận một MẢNG CÁC ĐỐI TƯỢNG CARD THÔ từ API
function calculateHandValue(cards) {
    let value = 0;
    let numAces = 0; // Đếm số lá Át

    for (const card of cards) {
        // card ở đây là đối tượng card thô từ API (ví dụ: { "value": "ACE", "suit": "SPADES" })
        const cardValue = card.value; // Lấy trực tiếp giá trị string từ object
        
        if (cardValue === 'ACE') {
            numAces++;
            value += CARD_VALUES['ACE']; // Ban đầu coi Át là 11
        } else {
            value += CARD_VALUES[cardValue]; // Sử dụng CARD_VALUES với giá trị string từ API (ví dụ: 'KING', '2', '10')
        }
    }

    // Xử lý các lá Át (nếu tổng > 21 và có Át, giảm Át từ 11 xuống 1)
    while (value > 21 && numAces > 0) {
        value -= 10; // Giảm 10 điểm (từ 11 xuống 1)
        numAces--;
    }
    return value;
}

// Hàm để định dạng hiển thị bài ra Discord
// Hàm này bây giờ nhận một MẢNG CÁC ĐỐI TƯỢNG CARD THÔ
function formatHandForDisplay(arrOfCardObjects, hideDealerCard = false) {
    let cardsToDisplay = arrOfCardObjects.map(card => formatCardValueToString(card)); // Chuyển đổi từng object thành chuỗi hiển thị
    
    if (hideDealerCard && cardsToDisplay.length > 1) {
        // Ẩn lá bài thứ hai của Dealer
        cardsToDisplay[1] = '??'; 
    }
    return '```' + cardsToDisplay.join('  ') + '```';
}

async function drawNewCard(deckID) {
    const deckData = (await axios.get(`${API_URL}/${deckID}/draw/?count=1`)).data;
    if (!deckData || !deckData.success || deckData.cards.length === 0) {
        throw new Error('Lỗi: Không thể rút bài mới');
    }
    return deckData.cards[0]; // <-- TRẢ VỀ ĐỐI TƯỢNG CARD THÔ
}

// Kiểm tra Xì Dách (A + 10/J/Q/K)
// Hàm này bây giờ nhận một MẢNG CÁC ĐỐI TƯỢNG CARD THÔ
function isXiDach(cards) {
    if (cards.length !== 2) return false;
    const card1Val = cards[0].value;
    const card2Val = cards[1].value;

    const isCard1Ace = card1Val === 'ACE';
    const isCard2Ace = card2Val === 'ACE';

    const isCard1Ten = ['10', 'JACK', 'QUEEN', 'KING'].includes(card1Val);
    const isCard2Ten = ['10', 'JACK', 'QUEEN', 'KING'].includes(card2Val);

    return (isCard1Ace && isCard2Ten) || (isCard2Ace && isCard1Ten);
}

// Kiểm tra Xì Bàn (A + A)
// Hàm này bây giờ nhận một MẢNG CÁC ĐỐI TƯỢNG CARD THÔ
function isXiBan(cards) {
    return cards.length === 2 && cards[0].value === 'ACE' && cards[1].value === 'ACE';
}

// Kiểm tra Ngũ Linh (5 lá và tổng điểm <= 21)
// Hàm này bây giờ nhận một MẢNG CÁC ĐỐI TƯỢNG CARD THÔ
function isNguLinh(cards) {
    if (cards.length !== 5) return false;
    return calculateHandValue(cards) <= 21;
}

// Kiểm tra Quắc (Bust)
// Hàm này bây giờ nhận một MẢNG CÁC ĐỐI TƯỢNG CARD THÔ
function isBust(cards) {
    return calculateHandValue(cards) > 21;
}

module.exports = {
    createNewDeck,
    formatHandForDisplay,
    formatCardValueToString, // Vẫn export nếu bạn cần dùng ở đâu đó, nhưng tốt nhất là chỉ dùng nội bộ
    drawNewCard,
    calculateHandValue,
    isXiDach,
    isXiBan,
    isNguLinh,
    isBust
};