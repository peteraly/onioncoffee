// src/components/CoffeeList.js

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

function CoffeeList() {
  const [coffees, setCoffees] = useState([]);

  useEffect(() => {
    const fetchCoffees = async () => {
      const coffeesCollection = collection(db, 'coffees');
      const coffeesSnapshot = await getDocs(coffeesCollection);
      const coffeesList = coffeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoffees(coffeesList);
    };

    fetchCoffees();
  }, []);

  return (
    <div>
      <h2>Our Coffee Selection</h2>
      <ul>
        {coffees.map(coffee => (
          <li key={coffee.id}>{coffee.name} - ${coffee.price}</li>
        ))}
      </ul>
    </div>
  );
}

export default CoffeeList;