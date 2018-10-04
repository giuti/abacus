import React from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, FlatList } from 'react-native';
import { createStackNavigator } from 'react-navigation';

class HomeScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        <Button
          title="Go to Matches"
          onPress={() => this.props.navigation.navigate('Matches')}
        />
      </View>
    );
  }
}

class MatchesScreen extends React.Component {
  constructor(props){
    super(props);
    this.state ={ isLoading: true}
  }

  componentDidMount(){
    return fetch('http://api.football-data.org/v2/competitions/2014/matches',
      {
        headers: {
          'X-Auth-Token': '2b235ab73c8a4a8b9cbc541da8ab5191'
        }
      })
      .then((response) => response.json())
      .then((responseJson) => {
        this.setState({
          isLoading: false,
          matchesData: responseJson,
        }, function(){

        });

      })
      .catch((error) =>{
        console.error(error);
      });
  }

  render() {
    if(this.state.isLoading){
      return(
        <View style={{flex: 1, padding: 20}}>
          <ActivityIndicator/>
        </View>
      )
    }

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>{this.state.matchesData.competition.name}</Text>
        <FlatList
          data={this.state.matchesData.matches}
          renderItem={({item}) =>
            <View>
              <Text>{item.homeTeam.name} {item.score.fullTime.homeTeam != null ? (item.score.fullTime.homeTeam) : (<Text>?</Text>)} - {item.score.fullTime.awayTeam != null ? (item.score.fullTime.awayTeam) : (<Text>?</Text>)} {item.awayTeam.name}</Text>
            </View>
          }
          keyExtractor={(item, index) => 'match_'+item.id}
        />
        <Button
          title="Calculate"
          onPress={() => this.props.navigation.navigate('CalculatedTable')}
        />
      </View>
    );
  }
}

class CalculatedTableScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Calculated Table Screen</Text>
      </View>
    );
  }
}

const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    Matches: MatchesScreen,
    CalculatedTable: CalculatedTableScreen,
  },
  {
    initialRouteName: 'Home',
  }
);

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
