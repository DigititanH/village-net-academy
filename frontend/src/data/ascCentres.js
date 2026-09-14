/** Digititan ASC (Academy Support Center) listings by province */

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export const ascCentres = [
  { id: 28, name: "Digititan Programme", province: "Gauteng" },
  { id: 1, name: "Aspire Foundation", province: "KwaZulu-Natal" },
  { id: 2, name: "Towards Uniting the Church", province: "KwaZulu-Natal" },
  { id: 3, name: "Bambiqhaza Consulting and Community Development", province: "KwaZulu-Natal" },
  { id: 4, name: "Tupix Consulting", province: "KwaZulu-Natal" },
  { id: 5, name: "Waterloo Development Organisation", province: "KwaZulu-Natal" },
  { id: 6, name: "Stranger Training Centre", province: "KwaZulu-Natal" },
  { id: 7, name: "The Healing and Transformation Centre", province: "KwaZulu-Natal" },
  { id: 8, name: "Nozibele Solutions Pty Ltd", province: "KwaZulu-Natal" },
  { id: 9, name: "Ziwileh Trading and Umusakamanase Community Support Organisation", province: "KwaZulu-Natal" },
  { id: 10, name: "Umlazi Youth Skills Development", province: "KwaZulu-Natal" },
  { id: 11, name: "Inspire the Future", province: "KwaZulu-Natal" },
  { id: 12, name: "Kasi to Kasi Boys Conference", province: "KwaZulu-Natal" },
  { id: 13, name: "Giant Heart", province: "KwaZulu-Natal" },
  { id: 14, name: "Well of Hope Foundation", province: "KwaZulu-Natal" },
  { id: 15, name: "Sibusisiwe Community Development", province: "KwaZulu-Natal" },
  { id: 16, name: "Gold CO", province: "KwaZulu-Natal" },
  { id: 17, name: "Umngeni Unemployed Graduates Forum", province: "KwaZulu-Natal" },
  { id: 18, name: "Masinganele Projects", province: "KwaZulu-Natal" },
  { id: 19, name: "Sisabhekile Health Care Centre", province: "KwaZulu-Natal" },
  { id: 20, name: "AMCSC", province: "KwaZulu-Natal" },
  { id: 21, name: "Senzokuhle Community Development", province: "KwaZulu-Natal" },
  { id: 22, name: "Gugu Dlamini Foundation", province: "KwaZulu-Natal" },
  { id: 23, name: "Art Vission", province: "KwaZulu-Natal" },
  { id: 24, name: "Amterdam Youth Development", province: "North West" },
  { id: 25, name: "Lesedi la batho", province: "Gauteng" },
  { id: 26, name: "City of Johannesburg libraries", province: "Gauteng" },
  { id: 27, name: "City of Tswane CWP", province: "Gauteng" },
];

export function getCentresByProvince(province) {
  return ascCentres.filter((c) => c.province === province);
}

export function getProvinceCounts() {
  return ascCentres.reduce((acc, centre) => {
    acc[centre.province] = (acc[centre.province] || 0) + 1;
    return acc;
  }, {});
}
