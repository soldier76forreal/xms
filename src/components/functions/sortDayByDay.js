export default function SortDayByDay(documents) {
    const grouped = documents.reduce((acc, document) => {
        const date = new Date(document.callDate).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(document);
        return acc;
      }, {});
      return(grouped)
  }



  