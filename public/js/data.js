/* Dữ liệu nội dung app — Bồ Câu & Sóc Nâu */
window.BCSN = (function () {
  const drive = (id) => "https://drive.google.com/file/d/" + id + "/view";

  const imgAlt = [
    "Bìa sách Hồ Chí Minh City – My City: Bồ Câu và Sóc Nâu trước Chợ Bến Thành",
    "Ú òa, làm quen nha! Bồ Câu và Sóc Nâu gặp nhau lần đầu",
    "Sóc Nâu và Bồ Câu mời bạn cùng đi khám phá Sài Gòn",
    "Toàn cảnh thành phố nhộn nhịp với nhà thờ Đức Bà và bưu điện",
    "Vùng đất phương Nam: dòng sông và những xóm làng đầu tiên",
    "Năm 1698: Nguyễn Hữu Cảnh lập phủ Gia Định",
    "Từ Gia Định đến Sài Gòn: thành Gia Định năm 1790",
    "Thành phố Hồ Chí Minh – hành trình hình thành qua các mốc 1698, 1790, 1975, 1976, 2025",
    "Chương 2: Thành phố rộng đến đâu? Bản đồ và diện tích sau năm 2025",
    "Chương 3: Những điểm du lịch nổi bật",
    "Khám phá thêm các địa danh trên bản đồ thành phố",
    "Dinh Độc Lập – một địa điểm đặc biệt trong lịch sử",
    "Bến Nhà Rồng – sông Sài Gòn",
    "Chợ Bến Thành – hơn cả một biểu tượng của thành phố",
    "Thảo Cầm Viên Sài Gòn – vườn thú và vườn thực vật",
    "Chương 4: Ẩm thực – cơm tấm, bánh mì, hủ tiếu",
    "Cơm tấm – hương vị Sài Gòn",
    "Đồ ăn đường phố nhộn nhịp",
    "Chương 5: Giao thông TP.HCM – xe buýt, xe máy, metro",
    "Metro đi thôi! Tuyến Metro số 1 Bến Thành – Suối Tiên",
    "Thành phố nhìn từ dòng sông: waterbus",
    "Hẹn gặp lại, TP.HCM! Bồ Câu và Sóc Nâu bên sông Sài Gòn",
    "Thử thách nhớ nhanh 1",
    "Thử thách nhớ nhanh 2",
  ];
  const img = (n) => ({ src: "img/p" + String(n).padStart(2, "0") + ".jpg", alt: imgAlt[n - 1], n });

  const chapters = [
    {
      id: 1,
      vi: "Lịch sử hình thành TP.HCM",
      en: "The Formation of Ho Chi Minh City",
      desc: "Ngược dòng thời gian, tìm những dấu mốc làm nên thành phố.",
      thumb: "img/p04.jpg",
      images: [4, 5, 6, 7, 8].map(img),
      say: {
        vi: ["Sóc Nâu: “Thành phố mình có từ bao giờ vậy?”", "Bồ Câu: “Cùng ngược dòng thời gian để tìm câu trả lời nhé!”"],
        en: ["Squirrel: “When did our city begin?”", "Pigeon: “Let’s travel back in time and find out!”"],
      },
      text: {
        title: ["Từ vùng đất phương Nam đến Thành phố Hồ Chí Minh", "From a Southern Land to Ho Chi Minh City"],
        paras: [
          ["Lịch sử vùng đất Thành phố Hồ Chí Minh trải qua một quá trình lâu dài. Trước khi trở thành một đô thị lớn, khu vực Sài Gòn – Gia Định đã có cư dân sinh sống và có điều kiện thuận lợi cho giao lưu nhờ hệ thống sông ngòi.",
           "Ho Chi Minh City has a long history. Before becoming a major city, the Saigon–Gia Dinh area was already home to local communities. Its network of rivers also supported travel, communication and trade."],
          ["Một dấu mốc quan trọng là năm 1698, khi Thống suất Nguyễn Hữu Cảnh vào kinh lược phương Nam. Ông lập phủ Gia Định, lấy Sài Gòn làm huyện Tân Bình và lập dinh Phiên Trấn. Đây được xem là một cột mốc quan trọng trong quá trình xác lập tổ chức hành chính của vùng đất Sài Gòn – Gia Định. (Hochiminh City Government)",
           "An important milestone came in 1698, when Nguyen Huu Canh was sent to the South. He established Gia Dinh Prefecture, made Saigon part of Tan Binh District, and established Phien Tran administrative division. This marked an important stage in the administrative development of the Saigon–Gia Dinh region."],
          ["Đến năm 1790, Thành Gia Định được xây dựng. Qua thời gian, Sài Gòn – Gia Định ngày càng phát triển về đô thị, giao thông, cảng và thương mại, dần trở thành một trung tâm quan trọng của Nam Bộ.",
           "In 1790, Gia Dinh Citadel was built. Over time, Saigon–Gia Dinh developed in terms of urban life, transportation, ports and commerce, gradually becoming an important centre of southern Viet Nam."],
          ["Ngày 30/4/1975 đánh dấu kết thúc chiến tranh và mở ra một giai đoạn mới. Đến 02/7/1976, tại kỳ họp thứ nhất Quốc hội khóa VI, Quốc hội chính thức quyết định đặt tên thành phố Sài Gòn – Gia Định là Thành phố Hồ Chí Minh. (Hochiminh City Government)",
           "30 April 1975 marked the end of the war and the beginning of a new period. On 2 July 1976, at the first session of the Sixth National Assembly, Saigon–Gia Dinh was officially named Ho Chi Minh City."],
          ["Một dấu mốc mới xuất hiện vào năm 2025. Toàn bộ diện tích và dân số của TP.HCM, tỉnh Bình Dương và tỉnh Bà Rịa – Vũng Tàu được sắp xếp thành Thành phố Hồ Chí Minh mới. Thành phố mới chính thức hoạt động từ 01/7/2025. (ITPC Ho Chi Minh City)",
           "Another major change came in 2025, when Ho Chi Minh City, Binh Duong Province and Ba Ria–Vung Tau Province were reorganised into the new Ho Chi Minh City. The new city officially began operating on 1 July 2025."],
          ["Như vậy, lịch sử TP.HCM là một hành trình liên tục từ vùng đất phương Nam, Sài Gòn – Gia Định đến một thành phố rộng lớn và hiện đại ngày nay.",
           "The history of Ho Chi Minh City is therefore a continuing journey from an early southern land through Saigon–Gia Dinh to the large and modern city of today."],
        ],
        sources: [
          "Sở KH&CN TP.HCM – Lịch sử Thành phố Hồ Chí Minh",
          "Sở VH&TT TP.HCM – 327 năm hình thành Sài Gòn–Chợ Lớn–Gia Định–TP.HCM",
          "HĐND TP.HCM – 50 năm Thành phố Sài Gòn mang tên Thành phố Hồ Chí Minh",
          "HĐND TP.HCM – TP.HCM sau sắp xếp năm 2025",
        ],
      },
      vocab: [
        ["milestone", "dấu mốc"], ["prefecture", "phủ (đơn vị hành chính xưa)"], ["citadel", "thành (thành trì)"],
        ["commerce", "thương mại"], ["reorganise", "sắp xếp lại"], ["officially", "chính thức"],
      ],
      sync: {"vi": [[0, 0], [3.3, 1], [19.4, 2], [36.1, 3], [54.4, 4]], "en": [[0, 0], [2.7, 1], [14.8, 2], [36.6, 3], [46.2, 4]]},
      pdf: drive("1R_KKnxv6OqcukxpvEaGnJ9_sHEwjtNxJ"),
      driveAudio: { vi: drive("1bBjzbcbH_c4I1bKD0yFkRr223K40g9TS"), en: drive("1KfwmPBQqB8I8yqFmJ-zKD4tjoMdvZali") },
    },
    {
      id: 2,
      vi: "Vị trí địa lý",
      en: "Geographical Location",
      desc: "Từ dòng sông đến biển xanh, khám phá một thành phố rộng mở.",
      thumb: "img/p09.jpg",
      images: [9].map(img),
      say: {
        vi: ["Sóc Nâu: “Thành phố mình rộng đến đâu nhỉ?”", "Bồ Câu: “Cùng khám phá từ những dòng sông đến biển xanh nhé!”"],
        en: ["Squirrel: “How far does our city stretch?”", "Pigeon: “Let’s explore from the rivers to the sea!”"],
      },
      text: {
        title: ["Một thành phố rộng mở từ đô thị đến biển", "A City Stretching from Urban Areas to the Sea"],
        paras: [
          ["Thành phố Hồ Chí Minh nằm ở phía Nam Việt Nam. Từ năm 2025, không gian địa lý của thành phố thay đổi lớn sau khi toàn bộ diện tích và dân số của TP.HCM, Bình Dương và Bà Rịa – Vũng Tàu được sắp xếp thành Thành phố Hồ Chí Minh mới.",
           "Ho Chi Minh City is located in southern Viet Nam. In 2025, its geographical space changed significantly when Ho Chi Minh City, Binh Duong Province and Ba Ria–Vung Tau Province were reorganised into the new Ho Chi Minh City."],
          ["Sau sắp xếp, thành phố có diện tích tự nhiên 6.772,59 km² và quy mô dân số 14.002.598 người. (ITPC Ho Chi Minh City)",
           "After the reorganisation, the city has a natural area of 6,772.59 km² and a population of 14,002,598 people."],
          ["Không gian thành phố hiện nay rất đa dạng. Khu vực đô thị trung tâm tập trung nhiều hoạt động hành chính, thương mại, dịch vụ và văn hóa. Những khu vực thuộc Bình Dương trước đây có thế mạnh về công nghiệp và đô thị. Không gian thuộc Bà Rịa – Vũng Tàu trước đây mở rộng thành phố về phía biển, bổ sung hệ thống cảng, vùng ven biển và không gian biển đảo.",
           "The city now contains a wide variety of geographical spaces. The central urban area is an important centre for administration, commerce, services and culture. Areas formerly belonging to Binh Duong have strong industrial and urban characteristics. Areas formerly belonging to Ba Ria–Vung Tau extend the city towards the sea, adding ports, coastal areas and maritime space."],
          ["Sông ngòi cũng là một đặc điểm nổi bật của thành phố. Sông Sài Gòn gắn bó lâu đời với quá trình hình thành, giao thương và phát triển đô thị. Ngày nay, các dòng sông vừa có giá trị về cảnh quan, môi trường vừa tham gia vào hoạt động giao thông và đời sống của người dân.",
           "Rivers are another important feature. The Saigon River has long been connected with the city's development and trade. Today, rivers contribute to the city's landscape, environment, transportation and everyday life."],
          ["Sự mở rộng không gian năm 2025 giúp TP.HCM kết nối đô thị – công nghiệp – sông – cảng – biển, tạo nên một thành phố có không gian địa lý phong phú hơn trước.",
           "The expansion in 2025 therefore connects urban areas, industrial zones, rivers, ports and the sea, giving Ho Chi Minh City a much more diverse geographical space."],
        ],
        sources: [
          "HĐND TP.HCM – Những quyết sách chiến lược của Trung ương để TP.HCM trở thành siêu đô thị",
          "ITPC TP.HCM – Cả nước chính thức còn 34 tỉnh, thành phố",
        ],
      },
      vocab: [
        ["area", "diện tích"], ["population", "dân số"], ["coastal", "ven biển"],
        ["port", "cảng"], ["industrial", "thuộc công nghiệp"], ["river", "sông"],
      ],
      pdf: drive("16oW6nwIoD3en3XzBxhDcNh1mO56j9zAM"),
      driveAudio: { vi: drive("1Xp_K9y7YLcoDS1XrNOppuqnGljF5dABj"), en: drive("1aZVUG_4ALbT21vzNNxd3c0FPzTho1-Zf") },
    },
    {
      id: 3,
      vi: "Những điểm du lịch nổi bật",
      en: "Highlight Destinations",
      desc: "Cùng hai người bạn ghé thăm những điểm đến đầy bất ngờ.",
      thumb: "img/p10.jpg",
      images: [10, 11, 12, 13, 14, 15].map(img),
      say: {
        vi: ["Sóc Nâu: “Hôm nay mình đi chơi ở đâu?”", "Bồ Câu: “Mỗi điểm đến đều có một câu chuyện. Đi cùng mình nhé!”"],
        en: ["Squirrel: “Where are we going today?”", "Pigeon: “Every destination tells a story. Come along!”"],
      },
      text: {
        title: ["Mỗi điểm đến – một câu chuyện", "Every Destination Tells a Story"],
        paras: [
          ["TP.HCM có nhiều địa điểm gắn với lịch sử, văn hóa và đời sống đô thị.",
           "Ho Chi Minh City has many places connected with its history, culture and urban life."],
          ["Dinh Độc Lập là một di tích lịch sử quan trọng, gắn với những sự kiện của lịch sử hiện đại Việt Nam và đặc biệt là ngày 30/4/1975. Ngày nay, nơi đây là một địa điểm để người dân, học sinh và du khách tìm hiểu lịch sử. (Hochiminh City Government)",
           "Independence Palace is an important historical site connected with major events in modern Vietnamese history, especially 30 April 1975. Today, it provides visitors and students with opportunities to learn about the past."],
          ["Bến Nhà Rồng nằm bên sông Sài Gòn. Ngày 05/6/1911, người thanh niên Nguyễn Tất Thành rời nơi đây để bắt đầu hành trình tìm đường cứu nước. Công trình Nhà Rồng được xây dựng từ thế kỷ XIX, kết hợp những nét kiến trúc phương Tây và trang trí phương Đông. (ubmttq.hochiminhcity.gov.vn)",
           "Nha Rong Wharf, located beside the Saigon River, has special historical significance. On 5 June 1911, the young Nguyen Tat Thanh left from this area to begin his journey to find a path for national liberation. The Nha Rong building dates from the nineteenth century and combines Western architecture with Eastern decorative elements."],
          ["Chợ Bến Thành từ lâu là một hình ảnh quen thuộc khi nhắc đến khu vực trung tâm thành phố. Không gian chợ giúp du khách tiếp xúc với hoạt động mua bán, hàng hóa, ẩm thực và nhịp sống đô thị.",
           "Ben Thanh Market has long been a familiar image of the city centre. Its market environment allows visitors to experience shopping, food and the lively rhythm of urban life."],
          ["Thảo Cầm Viên Sài Gòn là một không gian xanh và điểm tham quan lâu đời của thành phố. Năm 2022, UBND TP.HCM ban hành quyết định công nhận Thảo Cầm Viên Sài Gòn là điểm du lịch. (Công Báo Hồ Chí Minh)",
           "Saigon Zoo and Botanical Gardens is a long-established green space and visitor attraction. In 2022, the Ho Chi Minh City People's Committee officially recognised it as a tourist site."],
          ["Những địa điểm này không chỉ là nơi chụp ảnh. Khi tìm hiểu câu chuyện phía sau mỗi địa danh, chúng ta có thể hiểu thêm về lịch sử, thiên nhiên, con người và sự phát triển của TP.HCM.",
           "These destinations are more than places for taking photographs. Their stories help us discover the history, nature, people and development of Ho Chi Minh City."],
        ],
        sources: [
          "Sở VH&TT TP.HCM – Hành trình tìm hiểu Di tích Lịch sử Dinh Độc Lập",
          "HĐND TP.HCM – Theo dấu chân Hồ Chí Minh tại Bến Nhà Rồng",
          "Ủy ban MTTQ Việt Nam TP.HCM – Kỷ niệm hành trình từ Bến Nhà Rồng",
          "Công báo TP.HCM – Công nhận điểm du lịch Thảo Cầm Viên Sài Gòn",
        ],
      },
      vocab: [
        ["historical site", "di tích lịch sử"], ["wharf", "bến tàu"], ["market", "chợ"],
        ["architecture", "kiến trúc"], ["destination", "điểm đến"], ["tourist site", "điểm du lịch"],
      ],
      sync: {"vi": [[0, 0], [7.3, 2], [24.3, 3], [45.7, 4], [58.7, 5], [75.0, 1]], "en": [[0, 0], [6.9, 2], [21.6, 3], [44.4, 4], [54.5, 5], [66.9, 1]]},
      pdf: drive("1Ut3wVg5ROA8TL2FLpHa4PYGlDpABQ4TC"),
      driveAudio: { vi: drive("1WlTL_rpQjmBdUsrp44xVOfFT-nvOLdEd"), en: drive("1cwsdalIG0OPfJnjonK-sOQYOHYj9KhET") },
    },
    {
      id: 4,
      vi: "Văn hóa ẩm thực",
      en: "Food Culture",
      desc: "Một chuyến phiêu lưu thơm ngon qua những hương vị thân quen.",
      thumb: "img/p16.jpg",
      images: [16, 17, 18].map(img),
      say: {
        vi: ["Sóc Nâu: “Khám phá nãy giờ, mình đói bụng rồi!”", "Bồ Câu: “Vậy cùng tìm hiểu thành phố qua những món ngon nhé!”"],
        en: ["Squirrel: “All this exploring has made me hungry!”", "Pigeon: “Then let’s discover our city through its food!”"],
      },
      text: {
        title: ["Một thành phố kể chuyện bằng những món ăn", "A City That Tells Stories Through Food"],
        paras: [
          ["Ẩm thực TP.HCM nổi bật bởi sự đa dạng và giao thoa văn hóa. Theo nội dung giới thiệu trong chương trình phát triển sản phẩm du lịch ẩm thực của Sở Du lịch TP.HCM, thành phố không chỉ có một truyền thống ẩm thực. Qua nhiều thời kỳ, các cộng đồng cư dân mang theo những cách nấu ăn và hương vị khác nhau, tạo nên sự gặp gỡ của món Bắc, Trung, Nam, Hoa, Khmer cùng nhiều ảnh hưởng quốc tế. (Chạm vị ẩm thực)",
           "Ho Chi Minh City's food culture is known for its diversity and cultural exchange. According to the city's culinary tourism programme, Ho Chi Minh City does not have only one culinary tradition. Over time, different communities have brought their own kitchens and flavours, creating a rich mixture of northern, central and southern Vietnamese, Chinese and Khmer traditions, together with many international influences."],
          ["Cơm tấm, bánh mì và hủ tiếu là những món rất quen thuộc trong đời sống ẩm thực thành phố. Có thể gặp chúng từ hàng quán bình dân đến các khu vực mua bán đông đúc. Bên cạnh đó là một thế giới đồ ăn đường phố phong phú, góp phần tạo nên nhịp sống gần gũi và sinh động.",
           "Com tam, banh mi and hu tieu are familiar foods in the city's everyday culinary life. They can be found in simple local eateries and busy commercial areas. The city also has a lively street-food culture that forms part of its everyday rhythm."],
          ["Điều thú vị của ẩm thực TP.HCM không chỉ nằm ở hương vị. Một món ăn có thể kể câu chuyện về con người, cộng đồng cư dân, sự giao lưu văn hóa và đời sống đô thị.",
           "The importance of food goes beyond taste. A dish can tell us something about people, communities, cultural exchange and urban life."],
          ["Đây cũng là hướng mà thành phố đang phát triển trong quảng bá văn hóa và du lịch. Năm 2026, Sở Văn hóa và Thể thao TP.HCM cho biết thành phố đang đưa những câu chuyện về di sản, ẩm thực và đời sống đô thị lên các nền tảng số để người dân và du khách dễ tiếp cận hơn. (Hochiminh City Government)",
           "This idea is also reflected in the city's current cultural promotion. In 2026, Ho Chi Minh City's Department of Culture and Sports reported efforts to bring stories about heritage, food and urban life to digital platforms so that residents and visitors can explore them more easily."],
          ["Vì vậy, khám phá ẩm thực cũng là một cách thú vị để khám phá TP.HCM.",
           "Exploring food is therefore another way of discovering Ho Chi Minh City."],
        ],
        sources: [
          "Sở Du lịch TP.HCM – Chạm vị ẩm thực: Một thành phố kể chuyện bằng những món ăn",
          "Sở VH&TT TP.HCM – Đưa di sản và ẩm thực đô thị lên nền tảng số",
        ],
      },
      vocab: [
        ["food culture", "văn hóa ẩm thực"], ["cultural exchange", "giao thoa văn hóa"], ["street food", "đồ ăn đường phố"],
        ["community", "cộng đồng"], ["flavour", "hương vị"], ["tradition", "truyền thống"],
      ],
      sync: {"vi": [[0, 0], [23.7, 1], [31.6, 2]], "en": [[0, 0], [27.6, 1], [33.3, 2]]},
      pdf: drive("1VIZrj1lEhBU_MVcffhm2gaLTbUA8taT_"),
      driveAudio: { vi: drive("1xdu0tRM0TKZEDjeIUW3P9A7ywcBBjX_W"), en: drive("1bWjwe7Fbe-L7IfYnuIcn7KXfQdi1vQTO") },
    },
    {
      id: 5,
      vi: "Giao thông TP.HCM",
      en: "Getting Around Ho Chi Minh City",
      desc: "Lên metro, đi xe buýt và ngắm thành phố từ dòng sông.",
      thumb: "img/p20.jpg",
      images: [19, 20, 21].map(img),
      say: {
        vi: ["Sóc Nâu: “Đi khám phá thành phố bằng gì bây giờ?”", "Bồ Câu: “Metro, xe buýt hay waterbus? Mỗi cách đi đều có điều thú vị!”"],
        en: ["Squirrel: “How shall we explore the city?”", "Pigeon: “By metro, bus or waterbus? Each way has something special!”"],
      },
      text: {
        title: ["Nhiều cách để khám phá thành phố", "Many Ways to Explore the City"],
        paras: [
          ["TP.HCM có nhiều phương thức giao thông khác nhau. Trên đường phố, xe máy, ô tô và xe buýt là những phương tiện quen thuộc. Người dân cũng có thể sử dụng các phương tiện giao thông công cộng để di chuyển trong thành phố.",
           "Ho Chi Minh City has many forms of transportation. On its streets, motorbikes, cars and buses are familiar sights. Public transport also provides different ways for people to travel around the city."],
          ["Một dấu ấn mới của giao thông công cộng TP.HCM là Metro số 1 Bến Thành – Suối Tiên. Theo Ban Quản lý Đường sắt đô thị TP.HCM, tuyến có chiều dài khoảng 19,7 km, trong đó khoảng 2,6 km đi ngầm và 17,1 km đi trên cao. Tuyến có 14 nhà ga, gồm 3 ga ngầm và 11 ga trên cao. Hướng tuyến bắt đầu từ khu vực Bến Thành và kết thúc tại Depot Long Bình.",
           "An important development in the city's public transport is Metro Line 1, Ben Thanh–Suoi Tien. According to the Ho Chi Minh City Management Authority for Urban Railways, the line is approximately 19.7 kilometres long, including about 2.6 kilometres underground and 17.1 kilometres elevated. It has 14 stations: 3 underground and 11 elevated. The route begins in the Ben Thanh area and ends at Long Binh Depot."],
          ["TP.HCM còn là thành phố gắn với sông nước. Sông Sài Gòn và hệ thống sông, kênh rạch tạo điều kiện cho giao thông đường thủy. Đi tàu trên sông không chỉ là một cách di chuyển mà còn mang đến một góc nhìn khác về cảnh quan đô thị.",
           "Ho Chi Minh City is also closely connected with waterways. The Saigon River and the network of rivers and canals support water-based transportation. Travelling by boat also gives passengers a different view of the urban landscape."],
          ["Trong tương lai, hệ thống giao thông công cộng và đường sắt đô thị tiếp tục được phát triển. Quy hoạch đường sắt đô thị hướng tới mạng lưới các tuyến kết nối nhiều khu vực của thành phố.",
           "The city's public transport and urban railway systems continue to develop. Urban railway planning aims to create a wider network connecting different parts of the city."],
          ["Từ đường phố đến đường ray và dòng sông, mỗi phương tiện mang lại một cách khác nhau để quan sát và khám phá TP.HCM.",
           "From streets and railway tracks to the river, each form of transportation offers a different way to experience Ho Chi Minh City."],
        ],
        sources: [
          "Ban Quản lý Đường sắt đô thị TP.HCM – Tuyến Metro số 1 Bến Thành–Suối Tiên",
          "Ban Quản lý Đường sắt đô thị TP.HCM – Quy hoạch hệ thống đường sắt đô thị",
        ],
      },
      vocab: [
        ["metro", "tàu điện (metro)"], ["public transport", "giao thông công cộng"], ["station", "nhà ga"],
        ["underground", "đi ngầm"], ["elevated", "đi trên cao"], ["waterway", "đường thủy"],
      ],
      sync: {"vi": [[0, 0], [16.2, 1], [43.4, 2], [58.7, 1], [71.2, 2]], "en": [[0, 0], [13.9, 1], [38.7, 2], [56.8, 1], [66.8, 2]]},
      pdf: drive("1eFHbhxuRpTm8q9DcI97GOQAonnMO6KQI"),
      driveAudio: { vi: drive("19QqP2xks7DgB5TkvpLTnXfwJOR9cTvdT"), en: drive("1HG8wqeFbpeaO71qnCVcMTIXEx04VaBuT") },
    },
  ];

  /* Bộ đọc toàn bộ truyện: 24 tranh theo thứ tự */
  const fullBook = [];
  const label = (n) => {
    if (n === 1) return "Bìa sách";
    if (n <= 3) return "Làm quen";
    if (n <= 8) return "Chương 1";
    if (n === 9) return "Chương 2";
    if (n <= 15) return "Chương 3";
    if (n <= 18) return "Chương 4";
    if (n <= 21) return "Chương 5";
    if (n === 22) return "Kết thúc hành trình";
    return "Thử thách nhớ nhanh";
  };
  for (let n = 1; n <= 24; n++) fullBook.push(Object.assign(img(n), { label: label(n) }));

  const quiz = [
    { ch: 1, q: "Ai gắn với dấu mốc lập phủ Gia Định năm 1698?", o: ["Nguyễn Hữu Cảnh", "Nguyễn Du", "Lê Quý Đôn", "Trần Hưng Đạo"], a: 0, e: "Nguyễn Hữu Cảnh lập phủ Gia Định năm 1698, một dấu mốc quan trọng của vùng đất Sài Gòn – Gia Định." },
    { ch: 1, q: "Thành phố Sài Gòn – Gia Định chính thức mang tên Thành phố Hồ Chí Minh vào năm nào?", o: ["1698", "1790", "1976", "2000"], a: 2, e: "Quốc hội quyết định đặt tên Thành phố Hồ Chí Minh ngày 02/7/1976." },
    { ch: 2, q: "Thành phố Hồ Chí Minh nằm ở phía nào của Việt Nam?", o: ["Phía Bắc", "Phía Nam", "Phía Tây Bắc", "Phía Đông Bắc"], a: 1, e: "Thành phố Hồ Chí Minh nằm ở phía Nam Việt Nam." },
    { ch: 2, q: "Năm 2025, TP.HCM được sắp xếp cùng hai địa phương nào?", o: ["Đồng Nai và Long An", "Tây Ninh và Bình Phước", "Bình Dương và Bà Rịa – Vũng Tàu", "Cần Thơ và Đồng Tháp"], a: 2, e: "TP.HCM, Bình Dương và Bà Rịa – Vũng Tàu được sắp xếp thành Thành phố Hồ Chí Minh mới." },
    { ch: 3, q: "Địa danh nào gắn với hành trình ra đi tìm đường cứu nước ngày 05/6/1911?", o: ["Bến Nhà Rồng", "Chợ Bến Thành", "Thảo Cầm Viên", "Bưu điện Thành phố"], a: 0, e: "Bến Nhà Rồng là nơi gắn với sự kiện Nguyễn Tất Thành ra đi tìm đường cứu nước." },
    { ch: 3, q: "Muốn tìm hiểu về động vật và cây xanh, hai bạn nên đến đâu?", o: ["Metro số 1", "Chợ Bến Thành", "Dinh Độc Lập", "Thảo Cầm Viên Sài Gòn"], a: 3, e: "Thảo Cầm Viên Sài Gòn là điểm tham quan gắn với động vật, cây xanh và thiên nhiên." },
    { ch: 4, q: "Món nào được nhắc đến trong chương Ẩm thực?", o: ["Sushi", "Cơm tấm", "Pizza", "Kimchi"], a: 1, e: "Cơm tấm là một trong những món ăn quen thuộc được giới thiệu trong sách." },
    { ch: 4, q: "Điều gì làm ẩm thực TP.HCM phong phú?", o: ["Chỉ có một cách nấu", "Chỉ có món ngọt", "Sự giao thoa của nhiều cộng đồng và văn hóa", "Không có món ăn đường phố"], a: 2, e: "Sự giao thoa văn hóa và cộng đồng tạo nên nhiều món ăn, hương vị đặc sắc." },
    { ch: 5, q: "Metro số 1 của TP.HCM nối hai địa điểm nào?", o: ["Bến Thành – Suối Tiên", "Bến Nhà Rồng – Vũng Tàu", "Củ Chi – Cần Giờ", "Chợ Lớn – Thảo Cầm Viên"], a: 0, e: "Metro số 1 là tuyến Bến Thành – Suối Tiên." },
    { ch: 5, q: "Phương tiện nào giúp ngắm thành phố từ dòng sông?", o: ["Xe máy", "Ô tô", "Xe đạp", "Waterbus"], a: 3, e: "Waterbus mang đến một góc nhìn khác về thành phố từ mặt nước." },
  ];

  const results = [
    { min: 8, title: "Nhà khám phá thành phố!", text: "Bạn nhớ thật nhiều điều thú vị về thành phố của chúng mình.", badge: "gold" },
    { min: 5, title: "Một hành trình thật đáng nhớ!", text: "Cùng xem lại vài trang truyện để khám phá thêm nhé.", badge: "silver" },
    { min: 0, title: "Mỗi lần khám phá, thêm một điều hay!", text: "Bồ Câu và Sóc Nâu cùng bạn thử lại nhé.", badge: "bronze" },
  ];

  return {
    chapters, fullBook, quiz, results, img,
    links: {
      book: drive("1ksaL74gQccSKBgWqZk8nzvCZaEvZe2vj"),
      project: "https://drive.google.com/drive/folders/1plFWmgptLpGFmMU4KvOIW1XYiHJu9gg4",
    },
  };
})();
