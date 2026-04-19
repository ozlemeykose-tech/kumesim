import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useColors } from "@/hooks/useColors";

type Folder = {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  subtitle: string;
  articles: { title: string; body: string }[];
};

const FOLDERS: Folder[] = [
  {
    id: "beslenme",
    title: "Beslenme",
    icon: "food-apple-outline",
    color: "#3F8E62",
    subtitle: "Tohum, meyve ve takviyeler",
    articles: [
      {
        title: "Günlük Yem Karışımı",
        body:
          "Muhabbet ve sultan papağanı için %60 darı, %20 kanaryalık, %15 ay çekirdeği, %5 yulaf önerilir. Kanaryalar için saf kanarya tohumu + biraz pirinç.\n\nYem kabını her gün temizleyin, kabukları üfleyerek atın. Su mutlaka taze ve temiz olmalıdır.",
      },
      {
        title: "Meyve & Sebze",
        body:
          "Haftada 2-3 kez verilebilecek besinler:\n• Elma (çekirdeksiz)\n• Havuç (rendelenmiş)\n• Marul, ıspanak (az)\n• Salatalık dilimleri\n\nAvokado, çikolata, soğan ve kafeinli içecekler ZEHİRLİDİR.",
      },
      {
        title: "Üreme Döneminde Beslenme",
        body:
          "Yumurta verimi başladığında haşlanmış yumurta + galeta unu karışımı (haftada 3 kez) verilir. Kalsiyum için mürekkep balığı kemiği veya istiridye kabuğu kafese asılmalıdır.",
      },
    ],
  },
  {
    id: "kafes",
    title: "Kafes & Bakım",
    icon: "home-outline",
    color: "#2D7A4F",
    subtitle: "Kafes düzeni ve hijyen",
    articles: [
      {
        title: "Kafes Boyutu",
        body:
          "Tek muhabbet için minimum 40x30x40 cm. Çift için 60x40x50 cm. Kanarya çifti için 50x40x50 cm önerilir.\n\nTüneklerin çapı kuşun ayağını yarıya kadar saracak kalınlıkta olmalıdır (1.5-2 cm).",
      },
      {
        title: "Temizlik Programı",
        body:
          "Günlük: yem ve su kapları\nHaftalık: kafes tabanı, kum değişimi\nAylık: tüm kafes ılık sabunlu suyla yıkama, durulama, tamamen kuruduktan sonra kullanım.",
      },
      {
        title: "Aydınlatma & Sıcaklık",
        body:
          "İdeal sıcaklık 18-26°C. Direkt güneş ve klima/cereyan altına KOYMAYIN. Günde 10-12 saat doğal ışık veya tam spektrumlu lamba sağlayın.",
      },
    ],
  },
  {
    id: "saglik",
    title: "Sağlık & Hastalık",
    icon: "medical-bag",
    color: "#5B89A8",
    subtitle: "Belirtiler ve önlemler",
    articles: [
      {
        title: "Hasta Kuş Belirtileri",
        body:
          "• Tüyleri kabarık, sürekli uyku\n• İştahsızlık, su içmeme\n• Burun akıntısı, hapşırma\n• İshal veya kanlı dışkı\n• Kuyruk altı kirli/yapışık\n\nHerhangi birini görürseniz hemen kuşu sıcak ve sessiz bir yere alın, veterinere götürün.",
      },
      {
        title: "Tüy Dökümü (Mavna)",
        body:
          "Yılda 1-2 kez normaldir. Süresi 4-8 hafta. Bu dönemde:\n• B vitamini ve aminoasit takviyesi\n• Yumuşak yiyecekler\n• Stresten uzak tutma\n• Banyo suyu hazırlama (haftada 2 kez)",
      },
      {
        title: "Akar & Bit",
        body:
          "Tüylerde küçük siyah noktalar veya kuşun sürekli kaşınması akar belirtisidir. Veteriner onaylı akar spreyi kullanın. Tüm kafesi ve oyuncakları sıcak suyla yıkayın.",
      },
    ],
  },
  {
    id: "ureme",
    title: "Üreme",
    icon: "egg-outline",
    color: "#1B5E37",
    subtitle: "Çiftleştirme ve kuluçka",
    articles: [
      {
        title: "Çift Seçimi",
        body:
          "Aynı türden, akraba olmayan, sağlıklı ve en az 1 yaşındaki kuşlar tercih edilir. Akraba eşleşmesi sakat yavru riskini ciddi şekilde artırır — Kümesim'in soy ağacı uyarılarını dikkate alın.",
      },
      {
        title: "Kuluçka Süreleri",
        body:
          "• Muhabbet kuşu: 18 gün\n• Sultan papağanı: 20 gün\n• Kanarya / Fink: 14 gün\n• Hint bülbülü: 14 gün\n• Güvercin: 18 gün\n\nİlk yumurtadan itibaren değil, üçüncü yumurtadan sonra anne sürekli yatmaya başlar.",
      },
      {
        title: "Yuvalık Kutusu",
        body:
          "Muhabbet için 15x15x20 cm tahta yuvalık. Tabanına ince talaş veya kuru ot serin. Yuvalığı kafesin üst dış kısmına asın, anne girip çıkabilmelidir.",
      },
    ],
  },
  {
    id: "yavru",
    title: "Yavru Bakımı",
    icon: "baby-face-outline",
    color: "#3F8E62",
    subtitle: "Çıkımdan sonraki ilk haftalar",
    articles: [
      {
        title: "İlk 7 Gün",
        body:
          "Yavruya KESİNLİKLE dokunmayın. Anne yavruyu kustuğu süt+tohum karışımı ile besler. Kafes ortamını sessiz tutun, yuvalığı sallamayın.\n\nSadece yem ve su kontrolü için kafese yaklaşın.",
      },
      {
        title: "Halka Takma",
        body:
          "Halkalama 6-9. günler arasında yapılır. Yavrunun ayağı henüz incedir, halka rahat geçer. Geç kalırsanız ayak büyür, halka takılmaz.",
      },
      {
        title: "Sütten Kesme",
        body:
          "Yavru 4-5 haftada yuvalıktan çıkmaya başlar. 6. haftada bağımsız beslenmeye geçer. Bu dönemde anne+baba'dan ayrı bir kafese alınabilir.",
      },
    ],
  },
  {
    id: "turler",
    title: "Kuş Türleri",
    icon: "bird",
    color: "#2D7A4F",
    subtitle: "Tür özellikleri ve kişilikleri",
    articles: [
      {
        title: "Muhabbet Kuşu",
        body:
          "Avustralya kökenli, sosyal ve konuşmaya yatkın. Ortalama yaşam: 7-12 yıl. Kuluçka: 18 gün. Türkiye'de en yaygın evcil kuş türüdür.",
      },
      {
        title: "Sultan Papağanı (Cockatiel)",
        body:
          "Daha büyük, başında tepe tüyleri olan, ıslık çalmaya çok yatkın bir tür. Ortalama yaşam: 15-20 yıl. Kuluçka: 20 gün. Sosyal bir türdür, yalnız bırakılırsa stres yapar.",
      },
      {
        title: "Kanarya",
        body:
          "Şarkıcı kuşların kralı. Erkekler şakır, dişiler genelde sessizdir. Yaşam: 8-10 yıl. Kuluçka: 14 gün. Yalnız yaşamayı sever, çoğu zaman tek kafeste tutulur.",
      },
    ],
  },
];

export default function Kutuphane() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [openFolder, setOpenFolder] = useState<Folder | null>(null);
  const [openArticle, setOpenArticle] = useState<{ title: string; body: string } | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader active="kutuphane" />
      <View style={{
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: "#E8F1EC",
          alignItems: "center", justifyContent: "center",
        }}>
          <MaterialCommunityIcons name="book-open-variant" size={22} color="#1B5E37" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#1A2E22",
            fontFamily: "Inter_700Bold",
          }}>Kütüphane</Text>
          <Text style={{
            fontSize: 12,
            color: "#6B7B72",
            fontFamily: "Inter_400Regular",
            marginTop: 1,
          }}>Kuş bakımı için bilgi rehberi</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{
          fontSize: 13,
          color: "#5A7066",
          fontFamily: "Inter_500Medium",
          marginBottom: 12,
          paddingHorizontal: 4,
        }}>
          Klasörler
        </Text>

        {FOLDERS.map((folder) => (
          <Pressable
            key={folder.id}
            style={({ pressed }) => [
              {
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                borderWidth: 1,
                borderColor: "#E6EBE7",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 1,
              },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => setOpenFolder(folder)}
          >
            <View style={{
              width: 52, height: 52, borderRadius: 14,
              backgroundColor: folder.color + "1A",
              alignItems: "center", justifyContent: "center",
            }}>
              <MaterialCommunityIcons name={folder.icon} size={28} color={folder.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#1A2E22",
                fontFamily: "Inter_700Bold",
                marginBottom: 2,
              }}>{folder.title}</Text>
              <Text style={{
                fontSize: 12,
                color: "#6B7B72",
                fontFamily: "Inter_400Regular",
              }}>{folder.subtitle} · {folder.articles.length} yazı</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A0AEA5" />
          </Pressable>
        ))}
      </ScrollView>

      {/* Folder modal: list of articles */}
      <Modal visible={!!openFolder} animationType="slide" onRequestClose={() => setOpenFolder(null)}>
        {openFolder && (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient
              colors={[openFolder.color, openFolder.color + "DD"]}
              style={{
                paddingTop: Platform.OS === "web" ? 24 : insets.top + 12,
                paddingBottom: 18,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Pressable
                onPress={() => setOpenFolder(null)}
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </Pressable>
              <MaterialCommunityIcons name={openFolder.icon} size={28} color="#FFFFFF" />
              <Text style={{
                flex: 1,
                fontSize: 19,
                fontWeight: "700",
                color: "#FFFFFF",
                fontFamily: "Inter_700Bold",
              }}>{openFolder.title}</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {openFolder.articles.map((art, idx) => (
                <Pressable
                  key={idx}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.card,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      borderWidth: 1,
                      borderColor: "#E6EBE7",
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => setOpenArticle(art)}
                >
                  <Ionicons name="document-text-outline" size={22} color={openFolder.color} />
                  <Text style={{
                    flex: 1,
                    fontSize: 15,
                    fontFamily: "Inter_600SemiBold",
                    fontWeight: "600",
                    color: "#1A2E22",
                  }}>{art.title}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#A0AEA5" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Article modal: full body */}
      <Modal visible={!!openArticle} animationType="slide" onRequestClose={() => setOpenArticle(null)}>
        {openArticle && (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{
              paddingTop: Platform.OS === "web" ? 24 : insets.top + 12,
              paddingBottom: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: colors.card,
              borderBottomWidth: 1,
              borderBottomColor: "#E6EBE7",
            }}>
              <Pressable
                onPress={() => setOpenArticle(null)}
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  backgroundColor: "#E8F1EC",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={22} color="#1B5E37" />
              </Pressable>
              <Text style={{
                flex: 1,
                fontSize: 17,
                fontWeight: "700",
                color: "#1A2E22",
                fontFamily: "Inter_700Bold",
              }} numberOfLines={2}>{openArticle.title}</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={{
                fontSize: 15,
                lineHeight: 24,
                color: "#2A3A30",
                fontFamily: "Inter_400Regular",
              }}>
                {openArticle.body}
              </Text>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}
