To do:

- Interfejs rezerwacji
  - Kalendarz
  - Interfejs stworzonej rezerwacji
    - Dane wpisane do rezerwacji
    - Estymowana cena
    - Podstrona rezerwacji powinna zawierać parametr reservationId
    - Jeśli użytkownik wejdzie na podstronę booking z parametrem reservationId, to program powinien ściągnąć dane o rezerwacji z bazy i wyświetlić je na interfejsie
  - Dane wejściowe:
    - Planowany czas pobytu (Date)
    - Liczba osób (Number)
    - Dodatkowe odpłatne atrakcje (Object key value. Value boolean)
    - Dane kontaktowe:
      - Numer telefonu (String)
      - Imię  (String)
      - Nazwisko  (String)
      - Email (String)

Lepsze pokierowanie, jak dokonać rezerwację (Chodzi o początek).
Naprawić i zaktualizować podstrony.
Dodać mapę.
Dodać kalendarz rezerwacji jako zakładka. System wyświetla dany dzień na czerwono, jeżeli znajduję się on w rezerwacjach zaakceptowanych przez gospodarza. Nie da się stworzyć rezerwacji, jeśli którykolwiek z dni jest już zajęty.